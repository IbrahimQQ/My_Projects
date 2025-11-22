import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  PanResponder,
  Animated,
  Dimensions,
} from 'react-native';
import { useApp } from '../context/AppContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Safe math evaluation function
const evaluateExpression = (expression) => {
  try {
    // Replace math functions with JavaScript equivalents
    let expr = expression
      .replace(/sin\(/g, 'Math.sin(')
      .replace(/cos\(/g, 'Math.cos(')
      .replace(/tan\(/g, 'Math.tan(')
      .replace(/asin\(/g, 'Math.asin(')
      .replace(/acos\(/g, 'Math.acos(')
      .replace(/atan\(/g, 'Math.atan(')
      .replace(/log\(/g, 'Math.log10(')
      .replace(/ln\(/g, 'Math.log(')
      .replace(/sqrt\(/g, 'Math.sqrt(')
      .replace(/abs\(/g, 'Math.abs(')
      .replace(/exp\(/g, 'Math.exp(')
      .replace(/π/g, 'Math.PI')
      .replace(/e(?![xp])/g, 'Math.E')
      .replace(/\^/g, '**')
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/%/g, '/100');

    // Validate expression (basic check)
    if (!/^[\d\s+\-*/().Math\w]+$/.test(expr.replace(/\s/g, ''))) {
      return 'Error';
    }

    // eslint-disable-next-line no-eval
    const result = eval(expr);

    if (isNaN(result) || !isFinite(result)) {
      return 'Error';
    }

    // Format result
    if (Number.isInteger(result)) {
      return result.toString();
    }
    return parseFloat(result.toPrecision(12)).toString();
  } catch (error) {
    return 'Error';
  }
};

const Calculator = ({ visible, onClose }) => {
  const { calculatorPosition, setCalculatorPosition, trackToolUsage } = useApp();
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isScientific, setIsScientific] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [opacity, setOpacity] = useState(1);
  const [lastResult, setLastResult] = useState(null);

  const pan = useRef(new Animated.ValueXY({ x: calculatorPosition.x, y: calculatorPosition.y })).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
        setCalculatorPosition({ x: pan.x._value, y: pan.y._value });
      },
    })
  ).current;

  const handleNumber = (num) => {
    if (display === '0' || display === 'Error') {
      setDisplay(num);
      setExpression(num);
    } else {
      setDisplay(display + num);
      setExpression(expression + num);
    }
  };

  const handleOperator = (op) => {
    if (display === 'Error') return;

    const operators = ['+', '-', '×', '÷', '^'];
    const lastChar = expression.slice(-1);

    if (operators.includes(lastChar)) {
      setExpression(expression.slice(0, -1) + op);
    } else {
      setExpression(expression + op);
    }
    setDisplay(expression + op);
  };

  const handleFunction = (func) => {
    trackToolUsage('calculator', `function: ${func}`);

    switch (func) {
      case 'sin':
      case 'cos':
      case 'tan':
      case 'asin':
      case 'acos':
      case 'atan':
      case 'log':
      case 'ln':
      case 'sqrt':
      case 'abs':
      case 'exp':
        setExpression(expression + func + '(');
        setDisplay(expression + func + '(');
        break;
      case 'π':
        if (display === '0') {
          setDisplay('π');
          setExpression('π');
        } else {
          setDisplay(display + 'π');
          setExpression(expression + 'π');
        }
        break;
      case 'e':
        if (display === '0') {
          setDisplay('e');
          setExpression('e');
        } else {
          setDisplay(display + 'e');
          setExpression(expression + 'e');
        }
        break;
      case 'x²':
        setExpression(expression + '^2');
        setDisplay(expression + '²');
        break;
      case 'x³':
        setExpression(expression + '^3');
        setDisplay(expression + '³');
        break;
      case '(':
      case ')':
        setExpression(expression + func);
        setDisplay(expression + func);
        break;
      case '%':
        setExpression(expression + '%');
        setDisplay(expression + '%');
        break;
      case '±':
        if (display !== '0' && display !== 'Error') {
          if (expression.startsWith('-')) {
            setExpression(expression.slice(1));
            setDisplay(display.slice(1));
          } else {
            setExpression('-' + expression);
            setDisplay('-' + display);
          }
        }
        break;
      default:
        break;
    }
  };

  const handleDecimal = () => {
    // Check if current number already has decimal
    const parts = expression.split(/[+\-×÷^]/);
    const currentNumber = parts[parts.length - 1];

    if (!currentNumber.includes('.')) {
      if (display === '0' || display === 'Error') {
        setDisplay('0.');
        setExpression('0.');
      } else {
        setDisplay(display + '.');
        setExpression(expression + '.');
      }
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setExpression('');
  };

  const handleBackspace = () => {
    if (display.length > 1 && display !== 'Error') {
      setDisplay(display.slice(0, -1));
      setExpression(expression.slice(0, -1));
    } else {
      setDisplay('0');
      setExpression('');
    }
  };

  const handleEquals = () => {
    if (!expression) return;

    trackToolUsage('calculator', `calculate: ${expression}`);

    const result = evaluateExpression(expression);

    // Add to history
    if (result !== 'Error') {
      const historyEntry = {
        expression: expression,
        result: result,
        timestamp: new Date().toISOString(),
      };
      setHistory([historyEntry, ...history.slice(0, 19)]);
      setLastResult(result);
    }

    setDisplay(result);
    setExpression(result === 'Error' ? '' : result);
  };

  const handleHistorySelect = (item) => {
    setExpression(item.result);
    setDisplay(item.result);
    setShowHistory(false);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const toggleOpacity = () => {
    setOpacity(opacity === 1 ? 0.85 : 1);
  };

  const renderButton = (label, onPress, style = {}, textStyle = {}) => (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.buttonText, textStyle]}>{label}</Text>
    </TouchableOpacity>
  );

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        isMinimized && styles.containerMinimized,
        { transform: pan.getTranslateTransform(), opacity },
      ]}
    >
      {/* Drag Handle */}
      <View {...panResponder.panHandlers} style={styles.dragHandle}>
        <View style={styles.handleBar} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setIsScientific(!isScientific)}>
          <Text style={styles.title}>
            🧮 {isScientific ? 'Scientific' : 'Basic'}
          </Text>
        </TouchableOpacity>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setShowHistory(!showHistory)}>
            <Text style={styles.headerBtnText}>📋</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={toggleOpacity}>
            <Text style={styles.headerBtnText}>{opacity === 1 ? '◐' : '●'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={toggleMinimize}>
            <Text style={styles.headerBtnText}>{isMinimized ? '▢' : '−'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={onClose}>
            <Text style={styles.headerBtnText}>×</Text>
          </TouchableOpacity>
        </View>
      </View>

      {!isMinimized && (
        <>
          {/* Display */}
          <View style={styles.displayContainer}>
            <Text style={styles.expressionText} numberOfLines={1}>
              {expression || '0'}
            </Text>
            <Text style={styles.displayText} numberOfLines={1} adjustsFontSizeToFit>
              {display}
            </Text>
          </View>

          {showHistory ? (
            <ScrollView style={styles.historyContainer}>
              <Text style={styles.historyTitle}>Calculation History</Text>
              {history.length === 0 ? (
                <Text style={styles.noHistory}>No calculations yet</Text>
              ) : (
                history.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.historyItem}
                    onPress={() => handleHistorySelect(item)}
                  >
                    <Text style={styles.historyExpression}>{item.expression}</Text>
                    <Text style={styles.historyResult}>= {item.result}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          ) : (
            <View style={styles.keypadContainer}>
              {/* Scientific Functions Row (if scientific mode) */}
              {isScientific && (
                <>
                  <View style={styles.row}>
                    {renderButton('sin', () => handleFunction('sin'), styles.funcButton, styles.funcText)}
                    {renderButton('cos', () => handleFunction('cos'), styles.funcButton, styles.funcText)}
                    {renderButton('tan', () => handleFunction('tan'), styles.funcButton, styles.funcText)}
                    {renderButton('π', () => handleFunction('π'), styles.funcButton, styles.funcText)}
                    {renderButton('e', () => handleFunction('e'), styles.funcButton, styles.funcText)}
                  </View>
                  <View style={styles.row}>
                    {renderButton('log', () => handleFunction('log'), styles.funcButton, styles.funcText)}
                    {renderButton('ln', () => handleFunction('ln'), styles.funcButton, styles.funcText)}
                    {renderButton('√', () => handleFunction('sqrt'), styles.funcButton, styles.funcText)}
                    {renderButton('x²', () => handleFunction('x²'), styles.funcButton, styles.funcText)}
                    {renderButton('^', () => handleOperator('^'), styles.funcButton, styles.funcText)}
                  </View>
                </>
              )}

              {/* Main Keypad */}
              <View style={styles.row}>
                {renderButton('C', handleClear, styles.clearButton, styles.clearText)}
                {renderButton('(', () => handleFunction('('), styles.grayButton)}
                {renderButton(')', () => handleFunction(')'), styles.grayButton)}
                {renderButton('⌫', handleBackspace, styles.grayButton)}
                {renderButton('÷', () => handleOperator('÷'), styles.operatorButton, styles.operatorText)}
              </View>

              <View style={styles.row}>
                {renderButton('7', () => handleNumber('7'))}
                {renderButton('8', () => handleNumber('8'))}
                {renderButton('9', () => handleNumber('9'))}
                {renderButton('%', () => handleFunction('%'), styles.grayButton)}
                {renderButton('×', () => handleOperator('×'), styles.operatorButton, styles.operatorText)}
              </View>

              <View style={styles.row}>
                {renderButton('4', () => handleNumber('4'))}
                {renderButton('5', () => handleNumber('5'))}
                {renderButton('6', () => handleNumber('6'))}
                {renderButton('±', () => handleFunction('±'), styles.grayButton)}
                {renderButton('-', () => handleOperator('-'), styles.operatorButton, styles.operatorText)}
              </View>

              <View style={styles.row}>
                {renderButton('1', () => handleNumber('1'))}
                {renderButton('2', () => handleNumber('2'))}
                {renderButton('3', () => handleNumber('3'))}
                {renderButton('ANS', () => lastResult && handleNumber(lastResult), styles.grayButton, styles.smallText)}
                {renderButton('+', () => handleOperator('+'), styles.operatorButton, styles.operatorText)}
              </View>

              <View style={styles.row}>
                {renderButton('0', () => handleNumber('0'), styles.zeroButton)}
                {renderButton('.', handleDecimal)}
                {renderButton('=', handleEquals, styles.equalsButton, styles.equalsText)}
              </View>
            </View>
          )}
        </>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 320,
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
    zIndex: 1000,
  },
  containerMinimized: {
    height: 74,
  },
  dragHandle: {
    height: 24,
    backgroundColor: '#2c2c2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#48484a',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#2c2c2e',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerBtn: {
    padding: 6,
    marginLeft: 4,
  },
  headerBtnText: {
    fontSize: 16,
    color: '#fff',
  },
  displayContainer: {
    backgroundColor: '#1c1c1e',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'flex-end',
  },
  expressionText: {
    fontSize: 16,
    color: '#8e8e93',
    marginBottom: 4,
  },
  displayText: {
    fontSize: 36,
    fontWeight: '300',
    color: '#fff',
  },
  keypadContainer: {
    padding: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  button: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 56,
    backgroundColor: '#333333',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  buttonText: {
    fontSize: 22,
    color: '#fff',
    fontWeight: '500',
  },
  funcButton: {
    backgroundColor: '#1c1c1e',
    borderWidth: 1,
    borderColor: '#48484a',
    aspectRatio: 'auto',
    height: 40,
  },
  funcText: {
    fontSize: 14,
    color: '#ff9f0a',
  },
  grayButton: {
    backgroundColor: '#505050',
  },
  clearButton: {
    backgroundColor: '#505050',
  },
  clearText: {
    color: '#ff453a',
  },
  operatorButton: {
    backgroundColor: '#ff9f0a',
  },
  operatorText: {
    color: '#fff',
    fontSize: 26,
  },
  equalsButton: {
    backgroundColor: '#ff9f0a',
    flex: 2,
    maxWidth: 120,
  },
  equalsText: {
    fontSize: 28,
    color: '#fff',
  },
  zeroButton: {
    flex: 2,
    maxWidth: 120,
  },
  smallText: {
    fontSize: 12,
  },
  historyContainer: {
    flex: 1,
    padding: 16,
    maxHeight: 300,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  noHistory: {
    color: '#8e8e93',
    textAlign: 'center',
    marginTop: 20,
  },
  historyItem: {
    backgroundColor: '#2c2c2e',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  historyExpression: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 4,
  },
  historyResult: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '500',
  },
});

export default Calculator;
