// Python Learning Data

const tutorialsData = {
    basics: [
        {
            id: 'variables',
            title: 'Variables and Data Types',
            description: 'Learn about Python variables and basic data types',
            content: `
                <h2>Variables and Data Types</h2>
                <p>In Python, variables are containers for storing data values. Python has several built-in data types:</p>

                <h3>Numeric Types</h3>
                <div class="code-block">x = 5           # int
y = 3.14        # float
z = 2 + 3j      # complex</div>

                <h3>Text Type</h3>
                <div class="code-block">name = "Python"    # str
message = 'Hello'  # str</div>

                <h3>Boolean Type</h3>
                <div class="code-block">is_valid = True
is_active = False</div>

                <h3>Key Points</h3>
                <ul>
                    <li>Python is dynamically typed - you don't need to declare variable types</li>
                    <li>Use <span class="code-inline">type()</span> to check a variable's type</li>
                    <li>Variable names should be descriptive and use snake_case</li>
                    <li>Variables are case-sensitive</li>
                </ul>

                <h3>Type Conversion</h3>
                <div class="code-block">x = int(3.14)      # 3
y = float("5")     # 5.0
z = str(100)       # "100"</div>
            `
        },
        {
            id: 'operators',
            title: 'Operators',
            description: 'Arithmetic, comparison, and logical operators',
            content: `
                <h2>Operators in Python</h2>

                <h3>Arithmetic Operators</h3>
                <div class="code-block">a = 10
b = 3

print(a + b)   # Addition: 13
print(a - b)   # Subtraction: 7
print(a * b)   # Multiplication: 30
print(a / b)   # Division: 3.333...
print(a // b)  # Floor division: 3
print(a % b)   # Modulus: 1
print(a ** b)  # Exponentiation: 1000</div>

                <h3>Comparison Operators</h3>
                <div class="code-block">x = 5
y = 10

print(x == y)  # Equal to: False
print(x != y)  # Not equal: True
print(x > y)   # Greater than: False
print(x < y)   # Less than: True
print(x >= y)  # Greater or equal: False
print(x <= y)  # Less or equal: True</div>

                <h3>Logical Operators</h3>
                <div class="code-block">a = True
b = False

print(a and b)  # Logical AND: False
print(a or b)   # Logical OR: True
print(not a)    # Logical NOT: False</div>

                <h3>Assignment Operators</h3>
                <div class="code-block">x = 5
x += 3   # x = x + 3 → 8
x -= 2   # x = x - 2 → 6
x *= 4   # x = x * 4 → 24
x /= 3   # x = x / 3 → 8.0</div>
            `
        },
        {
            id: 'strings',
            title: 'Strings',
            description: 'String manipulation and formatting',
            content: `
                <h2>Working with Strings</h2>

                <h3>Creating Strings</h3>
                <div class="code-block">single = 'Hello'
double = "World"
multiline = """This is a
multiline string"""</div>

                <h3>String Operations</h3>
                <div class="code-block">text = "Python Programming"

# Concatenation
greeting = "Hello" + " " + "World"

# Repetition
repeat = "Ha" * 3  # "HaHaHa"

# Length
length = len(text)  # 18

# Accessing characters
first = text[0]     # 'P'
last = text[-1]     # 'g'

# Slicing
substring = text[0:6]  # "Python"</div>

                <h3>String Methods</h3>
                <div class="code-block">text = "  Python Programming  "

# Case conversion
print(text.upper())      # "  PYTHON PROGRAMMING  "
print(text.lower())      # "  python programming  "
print(text.capitalize()) # "  python programming  "
print(text.title())      # "  Python Programming  "

# Whitespace removal
print(text.strip())      # "Python Programming"
print(text.lstrip())     # "Python Programming  "
print(text.rstrip())     # "  Python Programming"

# Searching
print(text.find("Pro"))  # 9
print(text.count("a"))   # 2

# Replacement
print(text.replace("Python", "Java"))</div>

                <h3>String Formatting</h3>
                <div class="code-block">name = "Alice"
age = 25

# f-strings (Python 3.6+)
message = f"My name is {name} and I'm {age} years old"

# format() method
message = "My name is {} and I'm {} years old".format(name, age)

# % operator (old style)
message = "My name is %s and I'm %d years old" % (name, age)</div>
            `
        },
        {
            id: 'control-flow',
            title: 'Control Flow',
            description: 'If-else statements and conditional logic',
            content: `
                <h2>Control Flow in Python</h2>

                <h3>If-Else Statements</h3>
                <div class="code-block">age = 18

if age >= 18:
    print("You are an adult")
elif age >= 13:
    print("You are a teenager")
else:
    print("You are a child")</div>

                <h3>Conditional Expressions (Ternary Operator)</h3>
                <div class="code-block">age = 20
status = "adult" if age >= 18 else "minor"</div>

                <h3>Multiple Conditions</h3>
                <div class="code-block">score = 85

if score >= 90 and score <= 100:
    grade = 'A'
elif score >= 80:
    grade = 'B'
elif score >= 70:
    grade = 'C'
else:
    grade = 'F'</div>

                <h3>Match-Case (Python 3.10+)</h3>
                <div class="code-block">command = "start"

match command:
    case "start":
        print("Starting...")
    case "stop":
        print("Stopping...")
    case "pause":
        print("Pausing...")
    case _:
        print("Unknown command")</div>

                <h3>Checking Membership</h3>
                <div class="code-block">fruits = ["apple", "banana", "cherry"]

if "apple" in fruits:
    print("Apple is in the list")

if "grape" not in fruits:
    print("Grape is not in the list")</div>
            `
        },
        {
            id: 'loops',
            title: 'Loops',
            description: 'For and while loops, iteration',
            content: `
                <h2>Loops in Python</h2>

                <h3>For Loops</h3>
                <div class="code-block"># Iterate over a list
fruits = ["apple", "banana", "cherry"]
for fruit in fruits:
    print(fruit)

# Using range()
for i in range(5):
    print(i)  # 0, 1, 2, 3, 4

for i in range(2, 10, 2):
    print(i)  # 2, 4, 6, 8</div>

                <h3>While Loops</h3>
                <div class="code-block">count = 0
while count < 5:
    print(count)
    count += 1

# Infinite loop with break
while True:
    user_input = input("Enter 'quit' to exit: ")
    if user_input == "quit":
        break</div>

                <h3>Loop Control Statements</h3>
                <div class="code-block"># break - exit the loop
for i in range(10):
    if i == 5:
        break
    print(i)

# continue - skip to next iteration
for i in range(5):
    if i == 2:
        continue
    print(i)

# else clause - executed if loop completes normally
for i in range(5):
    print(i)
else:
    print("Loop completed")</div>

                <h3>Nested Loops</h3>
                <div class="code-block">for i in range(3):
    for j in range(3):
        print(f"({i}, {j})")</div>

                <h3>List Comprehensions</h3>
                <div class="code-block"># Create a list of squares
squares = [x**2 for x in range(10)]

# With condition
even_squares = [x**2 for x in range(10) if x % 2 == 0]</div>
            `
        },
        {
            id: 'functions',
            title: 'Functions',
            description: 'Defining and calling functions, parameters, return values',
            content: `
                <h2>Functions in Python</h2>

                <h3>Defining Functions</h3>
                <div class="code-block">def greet():
    print("Hello, World!")

greet()  # Call the function</div>

                <h3>Parameters and Arguments</h3>
                <div class="code-block">def greet(name):
    print(f"Hello, {name}!")

greet("Alice")

# Multiple parameters
def add(a, b):
    return a + b

result = add(5, 3)</div>

                <h3>Default Parameters</h3>
                <div class="code-block">def greet(name, greeting="Hello"):
    print(f"{greeting}, {name}!")

greet("Alice")              # Hello, Alice!
greet("Bob", "Hi")          # Hi, Bob!</div>

                <h3>Keyword Arguments</h3>
                <div class="code-block">def describe_person(name, age, city):
    print(f"{name} is {age} years old and lives in {city}")

describe_person(age=25, city="NYC", name="Alice")</div>

                <h3>Variable-Length Arguments</h3>
                <div class="code-block"># *args - variable positional arguments
def sum_all(*numbers):
    return sum(numbers)

result = sum_all(1, 2, 3, 4, 5)

# **kwargs - variable keyword arguments
def print_info(**info):
    for key, value in info.items():
        print(f"{key}: {value}")

print_info(name="Alice", age=25, city="NYC")</div>

                <h3>Lambda Functions</h3>
                <div class="code-block">square = lambda x: x**2
print(square(5))  # 25

# With map
numbers = [1, 2, 3, 4, 5]
squared = list(map(lambda x: x**2, numbers))</div>

                <h3>Docstrings</h3>
                <div class="code-block">def calculate_area(length, width):
    """
    Calculate the area of a rectangle.

    Args:
        length: The length of the rectangle
        width: The width of the rectangle

    Returns:
        The area of the rectangle
    """
    return length * width</div>
            `
        }
    ],

    dataStructures: [
        {
            id: 'lists',
            title: 'Lists',
            description: 'Working with Python lists',
            content: `
                <h2>Lists in Python</h2>

                <h3>Creating Lists</h3>
                <div class="code-block">numbers = [1, 2, 3, 4, 5]
mixed = [1, "hello", 3.14, True]
empty = []
nested = [[1, 2], [3, 4], [5, 6]]</div>

                <h3>Accessing Elements</h3>
                <div class="code-block">fruits = ["apple", "banana", "cherry"]

print(fruits[0])    # apple
print(fruits[-1])   # cherry
print(fruits[1:3])  # ['banana', 'cherry']</div>

                <h3>Modifying Lists</h3>
                <div class="code-block">fruits = ["apple", "banana"]

# Adding elements
fruits.append("cherry")        # Add to end
fruits.insert(1, "orange")     # Insert at index
fruits.extend(["grape", "kiwi"])  # Add multiple

# Removing elements
fruits.remove("banana")        # Remove by value
popped = fruits.pop()          # Remove and return last
del fruits[0]                  # Delete by index
fruits.clear()                 # Remove all elements</div>

                <h3>List Operations</h3>
                <div class="code-block">numbers = [3, 1, 4, 1, 5, 9, 2]

# Sorting
numbers.sort()                 # Sort in place
sorted_nums = sorted(numbers)  # Return sorted copy
numbers.reverse()              # Reverse in place

# Other operations
length = len(numbers)
count = numbers.count(1)       # Count occurrences
index = numbers.index(4)       # Find index

# Copying
copy = numbers.copy()
copy2 = numbers[:]</div>

                <h3>List Comprehensions</h3>
                <div class="code-block"># Basic comprehension
squares = [x**2 for x in range(10)]

# With condition
evens = [x for x in range(20) if x % 2 == 0]

# Nested comprehension
matrix = [[i*j for j in range(3)] for i in range(3)]</div>
            `
        },
        {
            id: 'tuples',
            title: 'Tuples',
            description: 'Immutable sequences in Python',
            content: `
                <h2>Tuples in Python</h2>

                <h3>Creating Tuples</h3>
                <div class="code-block">coordinates = (10, 20)
single = (42,)  # Note the comma
empty = ()
mixed = (1, "hello", 3.14)

# Without parentheses
point = 10, 20, 30</div>

                <h3>Accessing Elements</h3>
                <div class="code-block">colors = ("red", "green", "blue")

print(colors[0])     # red
print(colors[-1])    # blue
print(colors[1:3])   # ('green', 'blue')</div>

                <h3>Tuple Operations</h3>
                <div class="code-block">tuple1 = (1, 2, 3)
tuple2 = (4, 5, 6)

# Concatenation
combined = tuple1 + tuple2

# Repetition
repeated = tuple1 * 2

# Length and count
length = len(tuple1)
count = tuple1.count(2)
index = tuple1.index(3)</div>

                <h3>Tuple Unpacking</h3>
                <div class="code-block"># Basic unpacking
x, y, z = (1, 2, 3)

# Swapping values
a, b = 5, 10
a, b = b, a

# Extended unpacking
first, *middle, last = (1, 2, 3, 4, 5)</div>

                <h3>When to Use Tuples</h3>
                <ul>
                    <li>For data that shouldn't change (immutable)</li>
                    <li>As dictionary keys (lists can't be keys)</li>
                    <li>Returning multiple values from functions</li>
                    <li>Slightly faster than lists</li>
                </ul>
            `
        },
        {
            id: 'dictionaries',
            title: 'Dictionaries',
            description: 'Key-value pairs and hash maps',
            content: `
                <h2>Dictionaries in Python</h2>

                <h3>Creating Dictionaries</h3>
                <div class="code-block">person = {
    "name": "Alice",
    "age": 25,
    "city": "NYC"
}

# Using dict() constructor
person2 = dict(name="Bob", age=30)

# Empty dictionary
empty = {}</div>

                <h3>Accessing Values</h3>
                <div class="code-block">person = {"name": "Alice", "age": 25}

# Using key
name = person["name"]

# Using get() - safer, returns None if key doesn't exist
age = person.get("age")
country = person.get("country", "USA")  # Default value</div>

                <h3>Modifying Dictionaries</h3>
                <div class="code-block">person = {"name": "Alice"}

# Adding/updating
person["age"] = 25
person["city"] = "NYC"
person.update({"email": "alice@email.com", "age": 26})

# Removing
age = person.pop("age")
del person["city"]
person.clear()  # Remove all</div>

                <h3>Dictionary Methods</h3>
                <div class="code-block">person = {"name": "Alice", "age": 25, "city": "NYC"}

# Keys, values, items
keys = person.keys()
values = person.values()
items = person.items()

# Iteration
for key in person:
    print(key, person[key])

for key, value in person.items():
    print(f"{key}: {value}")

# Check existence
if "name" in person:
    print("Name exists")</div>

                <h3>Dictionary Comprehensions</h3>
                <div class="code-block"># Basic comprehension
squares = {x: x**2 for x in range(5)}

# From two lists
keys = ["a", "b", "c"]
values = [1, 2, 3]
dictionary = {k: v for k, v in zip(keys, values)}

# With condition
even_squares = {x: x**2 for x in range(10) if x % 2 == 0}</div>
            `
        },
        {
            id: 'sets',
            title: 'Sets',
            description: 'Unordered collections of unique elements',
            content: `
                <h2>Sets in Python</h2>

                <h3>Creating Sets</h3>
                <div class="code-block">numbers = {1, 2, 3, 4, 5}
mixed = {1, "hello", 3.14}
from_list = set([1, 2, 2, 3, 3, 4])  # {1, 2, 3, 4}

# Empty set (NOT {})
empty = set()</div>

                <h3>Set Operations</h3>
                <div class="code-block">set1 = {1, 2, 3, 4}
set2 = {3, 4, 5, 6}

# Union
union = set1 | set2  # or set1.union(set2)

# Intersection
intersection = set1 & set2  # or set1.intersection(set2)

# Difference
diff = set1 - set2  # or set1.difference(set2)

# Symmetric difference
sym_diff = set1 ^ set2  # or set1.symmetric_difference(set2)</div>

                <h3>Modifying Sets</h3>
                <div class="code-block">fruits = {"apple", "banana"}

# Adding elements
fruits.add("cherry")
fruits.update(["orange", "grape"])

# Removing elements
fruits.remove("banana")     # Raises error if not found
fruits.discard("kiwi")      # No error if not found
popped = fruits.pop()       # Remove arbitrary element
fruits.clear()</div>

                <h3>Set Methods</h3>
                <div class="code-block">set1 = {1, 2, 3}
set2 = {2, 3, 4}

# Membership
if 2 in set1:
    print("2 is in set1")

# Subset/Superset
is_subset = set1.issubset(set2)
is_superset = set1.issuperset(set2)
is_disjoint = set1.isdisjoint(set2)</div>

                <h3>Set Comprehensions</h3>
                <div class="code-block"># Basic comprehension
squares = {x**2 for x in range(10)}

# With condition
even_squares = {x**2 for x in range(10) if x % 2 == 0}</div>
            `
        }
    ],

    advanced: [
        {
            id: 'oop-basics',
            title: 'Object-Oriented Programming Basics',
            description: 'Classes, objects, and methods',
            content: `
                <h2>Object-Oriented Programming in Python</h2>

                <h3>Classes and Objects</h3>
                <div class="code-block">class Dog:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def bark(self):
        return f"{self.name} says Woof!"

# Creating objects
my_dog = Dog("Buddy", 5)
print(my_dog.name)
print(my_dog.bark())</div>

                <h3>Instance vs Class Variables</h3>
                <div class="code-block">class Dog:
    species = "Canis familiaris"  # Class variable

    def __init__(self, name):
        self.name = name  # Instance variable

dog1 = Dog("Buddy")
dog2 = Dog("Max")
print(Dog.species)  # Same for all instances</div>

                <h3>Methods</h3>
                <div class="code-block">class Circle:
    def __init__(self, radius):
        self.radius = radius

    # Instance method
    def area(self):
        return 3.14 * self.radius ** 2

    # Class method
    @classmethod
    def from_diameter(cls, diameter):
        return cls(diameter / 2)

    # Static method
    @staticmethod
    def pi():
        return 3.14159

circle = Circle(5)
circle2 = Circle.from_diameter(10)</div>

                <h3>Encapsulation</h3>
                <div class="code-block">class BankAccount:
    def __init__(self, balance):
        self.__balance = balance  # Private attribute

    def deposit(self, amount):
        if amount > 0:
            self.__balance += amount

    def get_balance(self):
        return self.__balance

account = BankAccount(1000)
account.deposit(500)
print(account.get_balance())</div>
            `
        },
        {
            id: 'inheritance',
            title: 'Inheritance',
            description: 'Class inheritance and polymorphism',
            content: `
                <h2>Inheritance in Python</h2>

                <h3>Basic Inheritance</h3>
                <div class="code-block">class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        pass

class Dog(Animal):
    def speak(self):
        return f"{self.name} says Woof!"

class Cat(Animal):
    def speak(self):
        return f"{self.name} says Meow!"

dog = Dog("Buddy")
cat = Cat("Whiskers")
print(dog.speak())
print(cat.speak())</div>

                <h3>Super() Function</h3>
                <div class="code-block">class Animal:
    def __init__(self, name):
        self.name = name
        print(f"Animal created: {name}")

class Dog(Animal):
    def __init__(self, name, breed):
        super().__init__(name)  # Call parent constructor
        self.breed = breed
        print(f"Dog created: {breed}")</div>

                <h3>Multiple Inheritance</h3>
                <div class="code-block">class Flyer:
    def fly(self):
        return "Flying!"

class Swimmer:
    def swim(self):
        return "Swimming!"

class Duck(Flyer, Swimmer):
    pass

duck = Duck()
print(duck.fly())
print(duck.swim())</div>

                <h3>Method Overriding</h3>
                <div class="code-block">class Shape:
    def area(self):
        return 0

class Rectangle(Shape):
    def __init__(self, length, width):
        self.length = length
        self.width = width

    def area(self):
        return self.length * self.width

class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius

    def area(self):
        return 3.14 * self.radius ** 2</div>
            `
        },
        {
            id: 'file-io',
            title: 'File I/O',
            description: 'Reading and writing files',
            content: `
                <h2>File Input/Output in Python</h2>

                <h3>Reading Files</h3>
                <div class="code-block"># Read entire file
with open('file.txt', 'r') as file:
    content = file.read()

# Read line by line
with open('file.txt', 'r') as file:
    for line in file:
        print(line.strip())

# Read all lines into a list
with open('file.txt', 'r') as file:
    lines = file.readlines()</div>

                <h3>Writing Files</h3>
                <div class="code-block"># Write (overwrites existing file)
with open('output.txt', 'w') as file:
    file.write("Hello, World!\n")
    file.write("Second line\n")

# Append
with open('output.txt', 'a') as file:
    file.write("Appended line\n")

# Write multiple lines
lines = ["Line 1\n", "Line 2\n", "Line 3\n"]
with open('output.txt', 'w') as file:
    file.writelines(lines)</div>

                <h3>File Modes</h3>
                <ul>
                    <li><span class="code-inline">'r'</span> - Read (default)</li>
                    <li><span class="code-inline">'w'</span> - Write (overwrites)</li>
                    <li><span class="code-inline">'a'</span> - Append</li>
                    <li><span class="code-inline">'r+'</span> - Read and write</li>
                    <li><span class="code-inline">'b'</span> - Binary mode (e.g., 'rb', 'wb')</li>
                </ul>

                <h3>Working with JSON</h3>
                <div class="code-block">import json

# Writing JSON
data = {"name": "Alice", "age": 25, "city": "NYC"}
with open('data.json', 'w') as file:
    json.dump(data, file, indent=4)

# Reading JSON
with open('data.json', 'r') as file:
    data = json.load(file)</div>

                <h3>Working with CSV</h3>
                <div class="code-block">import csv

# Writing CSV
with open('data.csv', 'w', newline='') as file:
    writer = csv.writer(file)
    writer.writerow(['Name', 'Age', 'City'])
    writer.writerow(['Alice', 25, 'NYC'])

# Reading CSV
with open('data.csv', 'r') as file:
    reader = csv.reader(file)
    for row in reader:
        print(row)</div>
            `
        },
        {
            id: 'exceptions',
            title: 'Exception Handling',
            description: 'Try-except blocks and error handling',
            content: `
                <h2>Exception Handling in Python</h2>

                <h3>Try-Except</h3>
                <div class="code-block">try:
    x = 10 / 0
except ZeroDivisionError:
    print("Cannot divide by zero!")

# Multiple exceptions
try:
    value = int(input("Enter a number: "))
except ValueError:
    print("Invalid input!")
except KeyboardInterrupt:
    print("Interrupted!")</div>

                <h3>Catching Multiple Exceptions</h3>
                <div class="code-block">try:
    # Some code
    pass
except (ValueError, TypeError) as e:
    print(f"Error: {e}")

# Catch all exceptions
try:
    # Some code
    pass
except Exception as e:
    print(f"An error occurred: {e}")</div>

                <h3>Else and Finally</h3>
                <div class="code-block">try:
    file = open('file.txt', 'r')
except FileNotFoundError:
    print("File not found!")
else:
    # Executed if no exception
    content = file.read()
    file.close()
finally:
    # Always executed
    print("Cleanup complete")</div>

                <h3>Raising Exceptions</h3>
                <div class="code-block">def divide(a, b):
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b

try:
    result = divide(10, 0)
except ValueError as e:
    print(e)</div>

                <h3>Custom Exceptions</h3>
                <div class="code-block">class InsufficientFundsError(Exception):
    def __init__(self, balance, amount):
        self.balance = balance
        self.amount = amount
        super().__init__(f"Insufficient funds: {balance} < {amount}")

class BankAccount:
    def __init__(self, balance):
        self.balance = balance

    def withdraw(self, amount):
        if amount > self.balance:
            raise InsufficientFundsError(self.balance, amount)
        self.balance -= amount</div>
            `
        },
        {
            id: 'modules',
            title: 'Modules and Packages',
            description: 'Organizing code with modules and packages',
            content: `
                <h2>Modules and Packages in Python</h2>

                <h3>Importing Modules</h3>
                <div class="code-block"># Import entire module
import math
print(math.pi)

# Import specific items
from math import pi, sqrt
print(pi)

# Import with alias
import numpy as np
import pandas as pd

# Import all (not recommended)
from math import *</div>

                <h3>Creating Your Own Module</h3>
                <div class="code-block"># mymodule.py
def greet(name):
    return f"Hello, {name}!"

PI = 3.14159

class Calculator:
    def add(self, a, b):
        return a + b

# main.py
import mymodule
print(mymodule.greet("Alice"))
print(mymodule.PI)</div>

                <h3>Package Structure</h3>
                <div class="code-block"># Directory structure:
# mypackage/
#   __init__.py
#   module1.py
#   module2.py
#   subpackage/
#     __init__.py
#     module3.py

# Importing from package
from mypackage import module1
from mypackage.subpackage import module3</div>

                <h3>The __name__ Variable</h3>
                <div class="code-block"># mymodule.py
def main():
    print("Running as main program")

if __name__ == "__main__":
    main()  # Only runs when executed directly</div>

                <h3>Common Built-in Modules</h3>
                <ul>
                    <li><span class="code-inline">os</span> - Operating system interface</li>
                    <li><span class="code-inline">sys</span> - System-specific parameters</li>
                    <li><span class="code-inline">datetime</span> - Date and time handling</li>
                    <li><span class="code-inline">random</span> - Random number generation</li>
                    <li><span class="code-inline">json</span> - JSON encoding/decoding</li>
                    <li><span class="code-inline">re</span> - Regular expressions</li>
                </ul>
            `
        },
        {
            id: 'decorators',
            title: 'Decorators',
            description: 'Function and class decorators',
            content: `
                <h2>Decorators in Python</h2>

                <h3>Basic Decorator</h3>
                <div class="code-block">def my_decorator(func):
    def wrapper():
        print("Before function call")
        func()
        print("After function call")
    return wrapper

@my_decorator
def say_hello():
    print("Hello!")

say_hello()</div>

                <h3>Decorator with Arguments</h3>
                <div class="code-block">def repeat(times):
    def decorator(func):
        def wrapper(*args, **kwargs):
            for _ in range(times):
                result = func(*args, **kwargs)
            return result
        return wrapper
    return decorator

@repeat(3)
def greet(name):
    print(f"Hello, {name}!")

greet("Alice")</div>

                <h3>Preserving Metadata</h3>
                <div class="code-block">from functools import wraps

def my_decorator(func):
    @wraps(func)  # Preserves function metadata
    def wrapper(*args, **kwargs):
        print("Before")
        result = func(*args, **kwargs)
        print("After")
        return result
    return wrapper

@my_decorator
def example():
    """This is an example function"""
    pass

print(example.__name__)  # 'example'
print(example.__doc__)   # 'This is an example function'</div>

                <h3>Class Decorators</h3>
                <div class="code-block">def singleton(cls):
    instances = {}
    def get_instance(*args, **kwargs):
        if cls not in instances:
            instances[cls] = cls(*args, **kwargs)
        return instances[cls]
    return get_instance

@singleton
class Database:
    def __init__(self):
        print("Initializing database")</div>

                <h3>Common Use Cases</h3>
                <div class="code-block"># Timing decorator
import time

def timer(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f"{func.__name__} took {end-start:.2f}s")
        return result
    return wrapper

@timer
def slow_function():
    time.sleep(1)</div>
            `
        },
        {
            id: 'generators',
            title: 'Generators and Iterators',
            description: 'Lazy evaluation and memory-efficient iteration',
            content: `
                <h2>Generators and Iterators in Python</h2>

                <h3>Generator Functions</h3>
                <div class="code-block">def countdown(n):
    while n > 0:
        yield n
        n -= 1

for i in countdown(5):
    print(i)  # 5, 4, 3, 2, 1</div>

                <h3>Generator Expressions</h3>
                <div class="code-block"># List comprehension (creates full list in memory)
squares_list = [x**2 for x in range(1000000)]

# Generator expression (lazy evaluation)
squares_gen = (x**2 for x in range(1000000))

# Use in a loop
for square in squares_gen:
    if square > 100:
        break</div>

                <h3>Iterator Protocol</h3>
                <div class="code-block">class Counter:
    def __init__(self, start, end):
        self.current = start
        self.end = end

    def __iter__(self):
        return self

    def __next__(self):
        if self.current > self.end:
            raise StopIteration
        self.current += 1
        return self.current - 1

counter = Counter(1, 5)
for num in counter:
    print(num)</div>

                <h3>Infinite Generators</h3>
                <div class="code-block">def fibonacci():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

fib = fibonacci()
for _ in range(10):
    print(next(fib))</div>

                <h3>Generator Pipeline</h3>
                <div class="code-block">def read_lines(file_path):
    with open(file_path) as file:
        for line in file:
            yield line.strip()

def filter_comments(lines):
    for line in lines:
        if not line.startswith('#'):
            yield line

def uppercase(lines):
    for line in lines:
        yield line.upper()

# Chain generators
lines = read_lines('file.txt')
filtered = filter_comments(lines)
result = uppercase(filtered)

for line in result:
    print(line)</div>
            `
        },
        {
            id: 'comprehensions',
            title: 'Advanced Comprehensions',
            description: 'List, dict, and set comprehensions',
            content: `
                <h2>Advanced Comprehensions</h2>

                <h3>Nested List Comprehensions</h3>
                <div class="code-block"># Flatten a 2D list
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
flattened = [num for row in matrix for num in row]

# Matrix transpose
transposed = [[row[i] for row in matrix] for i in range(len(matrix[0]))]

# Filter in nested comprehension
even_matrix = [[num for num in row if num % 2 == 0] for row in matrix]</div>

                <h3>Dictionary Comprehensions</h3>
                <div class="code-block"># Basic dict comprehension
squares = {x: x**2 for x in range(5)}

# From two lists
keys = ['a', 'b', 'c']
values = [1, 2, 3]
dictionary = {k: v for k, v in zip(keys, values)}

# Swap keys and values
original = {'a': 1, 'b': 2, 'c': 3}
swapped = {v: k for k, v in original.items()}

# With condition
filtered = {k: v for k, v in original.items() if v > 1}</div>

                <h3>Set Comprehensions</h3>
                <div class="code-block"># Basic set comprehension
squares = {x**2 for x in range(-5, 6)}

# Remove duplicates from list
numbers = [1, 2, 2, 3, 3, 3, 4, 5, 5]
unique = {x for x in numbers}

# With condition
even_squares = {x**2 for x in range(10) if x % 2 == 0}</div>

                <h3>Conditional Expressions</h3>
                <div class="code-block"># If-else in comprehension
values = [x if x % 2 == 0 else -x for x in range(10)]

# Multiple conditions
categorized = [
    'small' if x < 5 else 'medium' if x < 10 else 'large'
    for x in range(15)
]</div>

                <h3>Complex Comprehensions</h3>
                <div class="code-block"># Cartesian product
colors = ['red', 'blue']
sizes = ['S', 'M', 'L']
products = [(color, size) for color in colors for size in sizes]

# Filtering nested structures
data = [
    {'name': 'Alice', 'age': 25, 'city': 'NYC'},
    {'name': 'Bob', 'age': 30, 'city': 'LA'},
    {'name': 'Charlie', 'age': 35, 'city': 'NYC'}
]
nyc_names = [person['name'] for person in data if person['city'] == 'NYC']</div>
            `
        }
    ]
};

const quizzesData = {
    variables: [
        {
            question: "What is the correct way to create a variable in Python?",
            options: ["int x = 5", "x = 5", "var x = 5", "let x = 5"],
            correct: 1
        },
        {
            question: "Which of these is NOT a valid Python data type?",
            options: ["int", "float", "char", "bool"],
            correct: 2
        },
        {
            question: "How do you check the type of a variable 'x'?",
            options: ["typeof(x)", "type(x)", "x.type()", "checktype(x)"],
            correct: 1
        }
    ],
    operators: [
        {
            question: "What is the result of 10 // 3 in Python?",
            options: ["3.33", "3", "3.0", "4"],
            correct: 1
        },
        {
            question: "Which operator is used for exponentiation?",
            options: ["^", "**", "^^", "exp"],
            correct: 1
        }
    ],
    strings: [
        {
            question: "What does 'Hello'[1] return?",
            options: ["H", "e", "l", "Error"],
            correct: 1
        },
        {
            question: "Which method removes whitespace from both ends of a string?",
            options: ["trim()", "strip()", "remove()", "clean()"],
            correct: 1
        }
    ],
    'control-flow': [
        {
            question: "What is the correct syntax for an if-else statement?",
            options: [
                "if x > 5 then: print('yes')",
                "if (x > 5) print('yes')",
                "if x > 5: print('yes')",
                "if x > 5 { print('yes') }"
            ],
            correct: 2
        }
    ],
    loops: [
        {
            question: "What does range(5) produce?",
            options: ["[1, 2, 3, 4, 5]", "[0, 1, 2, 3, 4]", "[0, 1, 2, 3, 4, 5]", "5"],
            correct: 1
        },
        {
            question: "Which keyword is used to skip to the next iteration?",
            options: ["skip", "next", "continue", "pass"],
            correct: 2
        }
    ],
    functions: [
        {
            question: "How do you define a function in Python?",
            options: ["function myFunc():", "def myFunc():", "func myFunc():", "define myFunc():"],
            correct: 1
        },
        {
            question: "What keyword is used to return a value from a function?",
            options: ["return", "yield", "output", "give"],
            correct: 0
        }
    ],
    lists: [
        {
            question: "How do you add an item to the end of a list?",
            options: ["list.add(item)", "list.append(item)", "list.push(item)", "list.insert(item)"],
            correct: 1
        },
        {
            question: "What does list[-1] return?",
            options: ["First item", "Last item", "Error", "None"],
            correct: 1
        }
    ],
    tuples: [
        {
            question: "Are tuples mutable or immutable?",
            options: ["Mutable", "Immutable", "Depends", "Neither"],
            correct: 1
        }
    ],
    dictionaries: [
        {
            question: "How do you safely get a value from a dictionary?",
            options: ["dict[key]", "dict.get(key)", "dict->key", "dict.value(key)"],
            correct: 1
        },
        {
            question: "Can dictionary keys be lists?",
            options: ["Yes", "No", "Only empty lists", "Only with Python 3.8+"],
            correct: 1
        }
    ],
    sets: [
        {
            question: "Do sets allow duplicate values?",
            options: ["Yes", "No", "Only numbers", "Only strings"],
            correct: 1
        }
    ]
};

const challengesData = {
    easy: [
        {
            id: 'two-sum',
            title: 'Two Sum',
            difficulty: 'easy',
            description: 'Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.',
            examples: [
                { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]' },
                { input: 'nums = [3,2,4], target = 6', output: '[1,2]' }
            ],
            starterCode: `def two_sum(nums, target):
    # Write your solution here
    pass

# Test cases
print(two_sum([2,7,11,15], 9))  # Expected: [0,1]
print(two_sum([3,2,4], 6))      # Expected: [1,2]`,
            testCases: [
                { input: [[2,7,11,15], 9], expected: [0,1] },
                { input: [[3,2,4], 6], expected: [1,2] },
                { input: [[3,3], 6], expected: [0,1] }
            ]
        },
        {
            id: 'reverse-string',
            title: 'Reverse String',
            difficulty: 'easy',
            description: 'Write a function that reverses a string.',
            examples: [
                { input: '"hello"', output: '"olleh"' },
                { input: '"Python"', output: '"nohtyP"' }
            ],
            starterCode: `def reverse_string(s):
    # Write your solution here
    pass

# Test cases
print(reverse_string("hello"))   # Expected: "olleh"
print(reverse_string("Python"))  # Expected: "nohtyP"`,
            testCases: [
                { input: ["hello"], expected: "olleh" },
                { input: ["Python"], expected: "nohtyP" },
                { input: [""], expected: "" }
            ]
        },
        {
            id: 'palindrome',
            title: 'Valid Palindrome',
            difficulty: 'easy',
            description: 'Check if a given string is a palindrome, ignoring spaces and case.',
            examples: [
                { input: '"A man a plan a canal Panama"', output: 'True' },
                { input: '"race a car"', output: 'False' }
            ],
            starterCode: `def is_palindrome(s):
    # Write your solution here
    pass

# Test cases
print(is_palindrome("A man a plan a canal Panama"))  # Expected: True
print(is_palindrome("race a car"))                   # Expected: False`,
            testCases: [
                { input: ["A man a plan a canal Panama"], expected: true },
                { input: ["race a car"], expected: false },
                { input: [""], expected: true }
            ]
        },
        {
            id: 'fizzbuzz',
            title: 'FizzBuzz',
            difficulty: 'easy',
            description: 'Return an array where each element is: "Fizz" if divisible by 3, "Buzz" if divisible by 5, "FizzBuzz" if divisible by both, or the number itself otherwise.',
            examples: [
                { input: 'n = 15', output: '["1","2","Fizz","4","Buzz",...]' }
            ],
            starterCode: `def fizzbuzz(n):
    # Write your solution here
    pass

# Test cases
print(fizzbuzz(15))  # Expected: ["1","2","Fizz","4","Buzz","Fizz",...]`,
            testCases: [
                { input: [5], expected: ["1","2","Fizz","4","Buzz"] },
                { input: [15], expected: ["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"] }
            ]
        }
    ],
    medium: [
        {
            id: 'longest-substring',
            title: 'Longest Substring Without Repeating Characters',
            difficulty: 'medium',
            description: 'Find the length of the longest substring without repeating characters.',
            examples: [
                { input: '"abcabcbb"', output: '3 (abc)' },
                { input: '"bbbbb"', output: '1 (b)' }
            ],
            starterCode: `def length_of_longest_substring(s):
    # Write your solution here
    pass

# Test cases
print(length_of_longest_substring("abcabcbb"))  # Expected: 3
print(length_of_longest_substring("bbbbb"))     # Expected: 1`,
            testCases: [
                { input: ["abcabcbb"], expected: 3 },
                { input: ["bbbbb"], expected: 1 },
                { input: ["pwwkew"], expected: 3 }
            ]
        },
        {
            id: 'group-anagrams',
            title: 'Group Anagrams',
            difficulty: 'medium',
            description: 'Group strings that are anagrams of each other.',
            examples: [
                { input: '["eat","tea","tan","ate","nat","bat"]', output: '[["bat"],["nat","tan"],["ate","eat","tea"]]' }
            ],
            starterCode: `def group_anagrams(strs):
    # Write your solution here
    pass

# Test cases
print(group_anagrams(["eat","tea","tan","ate","nat","bat"]))`,
            testCases: [
                { input: [["eat","tea","tan","ate","nat","bat"]], expected: [["bat"],["nat","tan"],["ate","eat","tea"]] }
            ]
        },
        {
            id: 'product-except-self',
            title: 'Product of Array Except Self',
            difficulty: 'medium',
            description: 'Return an array where each element is the product of all elements except itself, without using division.',
            examples: [
                { input: '[1,2,3,4]', output: '[24,12,8,6]' }
            ],
            starterCode: `def product_except_self(nums):
    # Write your solution here
    pass

# Test cases
print(product_except_self([1,2,3,4]))  # Expected: [24,12,8,6]`,
            testCases: [
                { input: [[1,2,3,4]], expected: [24,12,8,6] },
                { input: [[-1,1,0,-3,3]], expected: [0,0,9,0,0] }
            ]
        }
    ],
    hard: [
        {
            id: 'median-sorted-arrays',
            title: 'Median of Two Sorted Arrays',
            difficulty: 'hard',
            description: 'Find the median of two sorted arrays in O(log(m+n)) time.',
            examples: [
                { input: 'nums1 = [1,3], nums2 = [2]', output: '2.0' },
                { input: 'nums1 = [1,2], nums2 = [3,4]', output: '2.5' }
            ],
            starterCode: `def find_median_sorted_arrays(nums1, nums2):
    # Write your solution here
    pass

# Test cases
print(find_median_sorted_arrays([1,3], [2]))     # Expected: 2.0
print(find_median_sorted_arrays([1,2], [3,4]))   # Expected: 2.5`,
            testCases: [
                { input: [[1,3], [2]], expected: 2.0 },
                { input: [[1,2], [3,4]], expected: 2.5 }
            ]
        },
        {
            id: 'trapping-rain-water',
            title: 'Trapping Rain Water',
            difficulty: 'hard',
            description: 'Calculate how much water can be trapped after raining given elevation heights.',
            examples: [
                { input: '[0,1,0,2,1,0,1,3,2,1,2,1]', output: '6' }
            ],
            starterCode: `def trap(height):
    # Write your solution here
    pass

# Test cases
print(trap([0,1,0,2,1,0,1,3,2,1,2,1]))  # Expected: 6`,
            testCases: [
                { input: [[0,1,0,2,1,0,1,3,2,1,2,1]], expected: 6 },
                { input: [[4,2,0,3,2,5]], expected: 9 }
            ]
        }
    ]
};

const librariesData = {
    matplotlib: [
        {
            id: 'matplotlib-basics',
            title: 'Matplotlib Basics',
            description: 'Introduction to plotting with Matplotlib',
            content: `
                <h2>Matplotlib Basics</h2>

                <h3>Installation</h3>
                <div class="code-block">pip install matplotlib</div>

                <h3>Basic Line Plot</h3>
                <div class="code-block">import matplotlib.pyplot as plt

x = [1, 2, 3, 4, 5]
y = [2, 4, 6, 8, 10]

plt.plot(x, y)
plt.xlabel('X axis')
plt.ylabel('Y axis')
plt.title('Basic Line Plot')
plt.show()</div>

                <h3>Multiple Plots</h3>
                <div class="code-block">import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 10, 100)

plt.plot(x, np.sin(x), label='sin(x)')
plt.plot(x, np.cos(x), label='cos(x)')
plt.xlabel('X')
plt.ylabel('Y')
plt.title('Sine and Cosine')
plt.legend()
plt.grid(True)
plt.show()</div>

                <h3>Customizing Plots</h3>
                <div class="code-block">plt.plot(x, y,
         color='red',           # Line color
         linestyle='--',        # Line style
         linewidth=2,           # Line width
         marker='o',            # Marker style
         markersize=8,          # Marker size
         label='Data')          # Legend label

plt.show()</div>
            `
        },
        {
            id: 'matplotlib-types',
            title: 'Plot Types',
            description: 'Different types of plots in Matplotlib',
            content: `
                <h2>Different Plot Types</h2>

                <h3>Scatter Plot</h3>
                <div class="code-block">import matplotlib.pyplot as plt
import numpy as np

x = np.random.rand(50)
y = np.random.rand(50)
colors = np.random.rand(50)
sizes = 1000 * np.random.rand(50)

plt.scatter(x, y, c=colors, s=sizes, alpha=0.5)
plt.colorbar()
plt.show()</div>

                <h3>Bar Chart</h3>
                <div class="code-block">categories = ['A', 'B', 'C', 'D']
values = [25, 40, 30, 55]

plt.bar(categories, values, color='skyblue')
plt.xlabel('Categories')
plt.ylabel('Values')
plt.title('Bar Chart')
plt.show()</div>

                <h3>Histogram</h3>
                <div class="code-block">data = np.random.randn(1000)

plt.hist(data, bins=30, edgecolor='black', alpha=0.7)
plt.xlabel('Value')
plt.ylabel('Frequency')
plt.title('Histogram')
plt.show()</div>

                <h3>Pie Chart</h3>
                <div class="code-block">sizes = [30, 25, 20, 25]
labels = ['A', 'B', 'C', 'D']
colors = ['gold', 'lightblue', 'lightgreen', 'pink']

plt.pie(sizes, labels=labels, colors=colors,
        autopct='%1.1f%%', startangle=90)
plt.axis('equal')
plt.show()</div>
            `
        },
        {
            id: 'matplotlib-subplots',
            title: 'Subplots and Layouts',
            description: 'Creating multiple plots in one figure',
            content: `
                <h2>Subplots and Layouts</h2>

                <h3>Creating Subplots</h3>
                <div class="code-block">import matplotlib.pyplot as plt
import numpy as np

fig, axes = plt.subplots(2, 2, figsize=(10, 8))

x = np.linspace(0, 10, 100)

axes[0, 0].plot(x, np.sin(x))
axes[0, 0].set_title('Sine')

axes[0, 1].plot(x, np.cos(x))
axes[0, 1].set_title('Cosine')

axes[1, 0].plot(x, np.tan(x))
axes[1, 0].set_title('Tangent')

axes[1, 1].plot(x, x**2)
axes[1, 1].set_title('Quadratic')

plt.tight_layout()
plt.show()</div>

                <h3>Sharing Axes</h3>
                <div class="code-block">fig, axes = plt.subplots(2, 1, sharex=True, figsize=(8, 6))

axes[0].plot(x, np.sin(x))
axes[0].set_ylabel('sin(x)')

axes[1].plot(x, np.cos(x))
axes[1].set_ylabel('cos(x)')
axes[1].set_xlabel('x')

plt.show()</div>
            `
        }
    ],
    seaborn: [
        {
            id: 'seaborn-intro',
            title: 'Seaborn Introduction',
            description: 'Getting started with Seaborn',
            content: `
                <h2>Introduction to Seaborn</h2>

                <h3>Installation</h3>
                <div class="code-block">pip install seaborn</div>

                <h3>Basic Usage</h3>
                <div class="code-block">import seaborn as sns
import matplotlib.pyplot as plt

# Set theme
sns.set_theme(style="darkgrid")

# Load sample dataset
tips = sns.load_dataset("tips")

# Simple scatter plot
sns.scatterplot(data=tips, x="total_bill", y="tip", hue="time")
plt.show()</div>

                <h3>Distribution Plots</h3>
                <div class="code-block"># Histogram with KDE
sns.histplot(data=tips, x="total_bill", kde=True)
plt.show()

# KDE plot
sns.kdeplot(data=tips, x="total_bill", hue="time")
plt.show()</div>
            `
        },
        {
            id: 'seaborn-categorical',
            title: 'Categorical Plots',
            description: 'Visualizing categorical data',
            content: `
                <h2>Categorical Data Visualization</h2>

                <h3>Bar Plot</h3>
                <div class="code-block">import seaborn as sns
import matplotlib.pyplot as plt

tips = sns.load_dataset("tips")

sns.barplot(data=tips, x="day", y="total_bill", hue="sex")
plt.show()</div>

                <h3>Box Plot</h3>
                <div class="code-block">sns.boxplot(data=tips, x="day", y="total_bill", hue="smoker")
plt.show()</div>

                <h3>Violin Plot</h3>
                <div class="code-block">sns.violinplot(data=tips, x="day", y="total_bill", hue="sex", split=True)
plt.show()</div>

                <h3>Count Plot</h3>
                <div class="code-block">sns.countplot(data=tips, x="day", hue="sex")
plt.show()</div>
            `
        },
        {
            id: 'seaborn-relationships',
            title: 'Relationship Plots',
            description: 'Visualizing relationships between variables',
            content: `
                <h2>Relationship Visualization</h2>

                <h3>Scatter Plot with Regression</h3>
                <div class="code-block">import seaborn as sns
import matplotlib.pyplot as plt

tips = sns.load_dataset("tips")

sns.regplot(data=tips, x="total_bill", y="tip")
plt.show()</div>

                <h3>Pair Plot</h3>
                <div class="code-block">sns.pairplot(data=tips, hue="time")
plt.show()</div>

                <h3>Heatmap</h3>
                <div class="code-block"># Correlation matrix
corr = tips.corr()
sns.heatmap(corr, annot=True, cmap='coolwarm')
plt.show()</div>
            `
        }
    ],
    tensorflow: [
        {
            id: 'tensorflow-intro',
            title: 'TensorFlow Basics',
            description: 'Introduction to TensorFlow and tensors',
            content: `
                <h2>TensorFlow Basics</h2>

                <h3>Installation</h3>
                <div class="code-block">pip install tensorflow</div>

                <h3>Creating Tensors</h3>
                <div class="code-block">import tensorflow as tf

# Constants
a = tf.constant(5)
b = tf.constant([1, 2, 3])
c = tf.constant([[1, 2], [3, 4]])

# Variables
var = tf.Variable([1, 2, 3])

# Operations
result = tf.add(a, 10)
matmul = tf.matmul(c, c)</div>

                <h3>Basic Operations</h3>
                <div class="code-block">x = tf.constant([[1, 2], [3, 4]])
y = tf.constant([[5, 6], [7, 8]])

# Element-wise operations
add = tf.add(x, y)
subtract = tf.subtract(x, y)
multiply = tf.multiply(x, y)

# Matrix multiplication
matmul = tf.matmul(x, y)

# Reduction operations
sum_all = tf.reduce_sum(x)
mean = tf.reduce_mean(x)
max_val = tf.reduce_max(x)</div>
            `
        },
        {
            id: 'tensorflow-nn',
            title: 'Neural Networks with TensorFlow',
            description: 'Building neural networks using Keras API',
            content: `
                <h2>Building Neural Networks</h2>

                <h3>Sequential Model</h3>
                <div class="code-block">import tensorflow as tf
from tensorflow import keras

model = keras.Sequential([
    keras.layers.Dense(128, activation='relu', input_shape=(784,)),
    keras.layers.Dropout(0.2),
    keras.layers.Dense(10, activation='softmax')
])

model.compile(optimizer='adam',
              loss='sparse_categorical_crossentropy',
              metrics=['accuracy'])</div>

                <h3>Training a Model</h3>
                <div class="code-block"># Load MNIST dataset
mnist = keras.datasets.mnist
(x_train, y_train), (x_test, y_test) = mnist.load_data()

# Normalize data
x_train = x_train / 255.0
x_test = x_test / 255.0

# Train
history = model.fit(x_train, y_train,
                    epochs=5,
                    validation_split=0.2)

# Evaluate
test_loss, test_acc = model.evaluate(x_test, y_test)
print(f'Test accuracy: {test_acc}')</div>

                <h3>Custom Layers</h3>
                <div class="code-block">class CustomLayer(keras.layers.Layer):
    def __init__(self, units=32):
        super(CustomLayer, self).__init__()
        self.units = units

    def build(self, input_shape):
        self.w = self.add_weight(
            shape=(input_shape[-1], self.units),
            initializer='random_normal',
            trainable=True
        )
        self.b = self.add_weight(
            shape=(self.units,),
            initializer='zeros',
            trainable=True
        )

    def call(self, inputs):
        return tf.matmul(inputs, self.w) + self.b</div>
            `
        },
        {
            id: 'tensorflow-cnn',
            title: 'Convolutional Neural Networks',
            description: 'Building CNNs for image classification',
            content: `
                <h2>Convolutional Neural Networks</h2>

                <h3>CNN Architecture</h3>
                <div class="code-block">import tensorflow as tf
from tensorflow import keras

model = keras.Sequential([
    keras.layers.Conv2D(32, (3, 3), activation='relu',
                        input_shape=(28, 28, 1)),
    keras.layers.MaxPooling2D((2, 2)),
    keras.layers.Conv2D(64, (3, 3), activation='relu'),
    keras.layers.MaxPooling2D((2, 2)),
    keras.layers.Conv2D(64, (3, 3), activation='relu'),
    keras.layers.Flatten(),
    keras.layers.Dense(64, activation='relu'),
    keras.layers.Dense(10, activation='softmax')
])</div>

                <h3>Data Augmentation</h3>
                <div class="code-block">data_augmentation = keras.Sequential([
    keras.layers.RandomFlip("horizontal"),
    keras.layers.RandomRotation(0.1),
    keras.layers.RandomZoom(0.1),
])

model = keras.Sequential([
    data_augmentation,
    keras.layers.Conv2D(32, 3, activation='relu'),
    # ... rest of the model
])</div>
            `
        }
    ],
    sklearn: [
        {
            id: 'sklearn-intro',
            title: 'Scikit-learn Basics',
            description: 'Introduction to machine learning with scikit-learn',
            content: `
                <h2>Scikit-learn Basics</h2>

                <h3>Installation</h3>
                <div class="code-block">pip install scikit-learn</div>

                <h3>Basic Workflow</h3>
                <div class="code-block">from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score

# Load data (example with iris dataset)
from sklearn.datasets import load_iris
iris = load_iris()
X, y = iris.data, iris.target

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Scale features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Train model
model = LogisticRegression()
model.fit(X_train_scaled, y_train)

# Predict and evaluate
y_pred = model.predict(X_test_scaled)
accuracy = accuracy_score(y_test, y_pred)
print(f'Accuracy: {accuracy}')</div>
            `
        },
        {
            id: 'sklearn-supervised',
            title: 'Supervised Learning',
            description: 'Classification and regression algorithms',
            content: `
                <h2>Supervised Learning Algorithms</h2>

                <h3>Classification</h3>
                <div class="code-block">from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier

# Decision Tree
dt = DecisionTreeClassifier(max_depth=5)
dt.fit(X_train, y_train)

# Random Forest
rf = RandomForestClassifier(n_estimators=100)
rf.fit(X_train, y_train)

# SVM
svm = SVC(kernel='rbf')
svm.fit(X_train, y_train)

# K-Nearest Neighbors
knn = KNeighborsClassifier(n_neighbors=5)
knn.fit(X_train, y_train)</div>

                <h3>Regression</h3>
                <div class="code-block">from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.ensemble import RandomForestRegressor

# Linear Regression
lr = LinearRegression()
lr.fit(X_train, y_train)

# Ridge Regression
ridge = Ridge(alpha=1.0)
ridge.fit(X_train, y_train)

# Lasso Regression
lasso = Lasso(alpha=0.1)
lasso.fit(X_train, y_train)

# Random Forest Regressor
rfr = RandomForestRegressor(n_estimators=100)
rfr.fit(X_train, y_train)</div>
            `
        },
        {
            id: 'sklearn-unsupervised',
            title: 'Unsupervised Learning',
            description: 'Clustering and dimensionality reduction',
            content: `
                <h2>Unsupervised Learning</h2>

                <h3>Clustering</h3>
                <div class="code-block">from sklearn.cluster import KMeans, DBSCAN, AgglomerativeClustering

# K-Means
kmeans = KMeans(n_clusters=3)
clusters = kmeans.fit_predict(X)

# DBSCAN
dbscan = DBSCAN(eps=0.5, min_samples=5)
clusters = dbscan.fit_predict(X)

# Hierarchical Clustering
agg = AgglomerativeClustering(n_clusters=3)
clusters = agg.fit_predict(X)</div>

                <h3>Dimensionality Reduction</h3>
                <div class="code-block">from sklearn.decomposition import PCA
from sklearn.manifold import TSNE

# PCA
pca = PCA(n_components=2)
X_reduced = pca.fit_transform(X)

# t-SNE
tsne = TSNE(n_components=2)
X_embedded = tsne.fit_transform(X)</div>

                <h3>Model Evaluation</h3>
                <div class="code-block">from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    mean_squared_error,
    r2_score
)

# Classification metrics
print(classification_report(y_test, y_pred))
print(confusion_matrix(y_test, y_pred))

# Regression metrics
mse = mean_squared_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)</div>
            `
        }
    ]
};
