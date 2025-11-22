"""
U-Net model for root segmentation.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Optional


class DoubleConv(nn.Module):
    """Double convolution block: (Conv -> BN -> ReLU) * 2"""

    def __init__(self, in_channels: int, out_channels: int, mid_channels: Optional[int] = None):
        super().__init__()
        if mid_channels is None:
            mid_channels = out_channels

        self.double_conv = nn.Sequential(
            nn.Conv2d(in_channels, mid_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(mid_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(mid_channels, out_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True)
        )

    def forward(self, x):
        return self.double_conv(x)


class Down(nn.Module):
    """Downscaling with maxpool then double conv"""

    def __init__(self, in_channels: int, out_channels: int):
        super().__init__()
        self.maxpool_conv = nn.Sequential(
            nn.MaxPool2d(2),
            DoubleConv(in_channels, out_channels)
        )

    def forward(self, x):
        return self.maxpool_conv(x)


class Up(nn.Module):
    """Upscaling then double conv"""

    def __init__(self, in_channels: int, out_channels: int, bilinear: bool = True):
        super().__init__()

        if bilinear:
            self.up = nn.Upsample(scale_factor=2, mode='bilinear', align_corners=True)
            self.conv = DoubleConv(in_channels, out_channels, in_channels // 2)
        else:
            self.up = nn.ConvTranspose2d(in_channels, in_channels // 2, kernel_size=2, stride=2)
            self.conv = DoubleConv(in_channels, out_channels)

    def forward(self, x1, x2):
        x1 = self.up(x1)

        # Pad if needed
        diffY = x2.size()[2] - x1.size()[2]
        diffX = x2.size()[3] - x1.size()[3]
        x1 = F.pad(x1, [diffX // 2, diffX - diffX // 2,
                       diffY // 2, diffY - diffY // 2])

        x = torch.cat([x2, x1], dim=1)
        return self.conv(x)


class OutConv(nn.Module):
    """Output convolution"""

    def __init__(self, in_channels: int, out_channels: int):
        super().__init__()
        self.conv = nn.Conv2d(in_channels, out_channels, kernel_size=1)

    def forward(self, x):
        return self.conv(x)


class UNet(nn.Module):
    """
    U-Net architecture for root segmentation.

    Args:
        n_channels: Number of input channels (1 for grayscale)
        n_classes: Number of output classes (3: background, main root, lateral)
        bilinear: Use bilinear upsampling instead of transposed conv
        base_features: Base number of features (doubled at each level)
    """

    def __init__(self, n_channels: int = 1, n_classes: int = 3,
                 bilinear: bool = True, base_features: int = 64):
        super().__init__()
        self.n_channels = n_channels
        self.n_classes = n_classes
        self.bilinear = bilinear

        factor = 2 if bilinear else 1

        self.inc = DoubleConv(n_channels, base_features)
        self.down1 = Down(base_features, base_features * 2)
        self.down2 = Down(base_features * 2, base_features * 4)
        self.down3 = Down(base_features * 4, base_features * 8)
        self.down4 = Down(base_features * 8, base_features * 16 // factor)

        self.up1 = Up(base_features * 16, base_features * 8 // factor, bilinear)
        self.up2 = Up(base_features * 8, base_features * 4 // factor, bilinear)
        self.up3 = Up(base_features * 4, base_features * 2 // factor, bilinear)
        self.up4 = Up(base_features * 2, base_features, bilinear)
        self.outc = OutConv(base_features, n_classes)

    def forward(self, x):
        x1 = self.inc(x)
        x2 = self.down1(x1)
        x3 = self.down2(x2)
        x4 = self.down3(x3)
        x5 = self.down4(x4)

        x = self.up1(x5, x4)
        x = self.up2(x, x3)
        x = self.up3(x, x2)
        x = self.up4(x, x1)

        logits = self.outc(x)
        return logits


class RootSegmentationModel:
    """
    Wrapper class for root segmentation model with training and inference.
    """

    def __init__(self, n_classes: int = 3, device: Optional[str] = None):
        """
        Initialize the model.

        Args:
            n_classes: Number of classes (3: background, main root, lateral)
            device: Device to use ('cuda', 'cpu', or None for auto)
        """
        if device is None:
            self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        else:
            self.device = torch.device(device)

        self.n_classes = n_classes
        self.model = UNet(n_channels=1, n_classes=n_classes, bilinear=True, base_features=64)
        self.model.to(self.device)

    def load(self, path: str):
        """Load model weights from file."""
        state_dict = torch.load(path, map_location=self.device)
        self.model.load_state_dict(state_dict)
        self.model.eval()

    def save(self, path: str):
        """Save model weights to file."""
        torch.save(self.model.state_dict(), path)

    def predict(self, image: 'np.ndarray') -> 'np.ndarray':
        """
        Predict segmentation mask for an image.

        Args:
            image: Grayscale image as numpy array (H, W)

        Returns:
            Predicted class mask (H, W) with values 0, 1, 2
        """
        import numpy as np

        self.model.eval()

        # Normalize and prepare input
        img = image.astype(np.float32)
        if img.max() > 0:
            img = img / img.max()

        # Add batch and channel dimensions
        tensor = torch.from_numpy(img).unsqueeze(0).unsqueeze(0).to(self.device)

        with torch.no_grad():
            output = self.model(tensor)
            pred = torch.argmax(output, dim=1).squeeze().cpu().numpy()

        return pred.astype(np.uint8)

    def predict_proba(self, image: 'np.ndarray') -> 'np.ndarray':
        """
        Predict class probabilities for an image.

        Args:
            image: Grayscale image as numpy array (H, W)

        Returns:
            Probability maps (n_classes, H, W)
        """
        import numpy as np

        self.model.eval()

        img = image.astype(np.float32)
        if img.max() > 0:
            img = img / img.max()

        tensor = torch.from_numpy(img).unsqueeze(0).unsqueeze(0).to(self.device)

        with torch.no_grad():
            output = self.model(tensor)
            probs = F.softmax(output, dim=1).squeeze().cpu().numpy()

        return probs
