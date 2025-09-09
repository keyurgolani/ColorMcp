# Convert Color - Use Case 3: iOS App Development

## Scenario

iOS developer converting design colors to Swift UIColor format for app implementation.

## Input Parameters

```json
{
  "color": "hsl(280, 100%, 50%)",
  "output_format": "swift",
  "precision": 3
}
```

## Output

```json
{
  "data": {
    "original": "hsl(280, 100%, 50%)",
    "converted": "UIColor(red: 0.667, green: 0.000, blue: 1.000, alpha: 1.000)",
    "format": "swift",
    "precision": 3
  }
}
```

## Practical Application

```swift
let accentColor = UIColor(red: 0.667, green: 0.000, blue: 1.000, alpha: 1.000)
```

## Key Insights

- Direct Swift UIColor format ready for iOS development
- High precision (3 decimal places) for accurate color reproduction
- Vibrant purple color perfect for accent elements
