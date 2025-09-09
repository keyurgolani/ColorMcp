# Convert Color - Use Case 2: Print Designer CMYK Conversion

## Scenario

A print designer needs to convert RGB colors to CMYK for accurate printing reproduction.

## Input Parameters

```json
{
  "color": "rgb(255, 87, 51)",
  "output_format": "cmyk",
  "precision": 2
}
```

## Output

```json
{
  "success": true,
  "data": {
    "original": "rgb(255, 87, 51)",
    "converted": "cmyk(0%, 66%, 80%, 0%)",
    "format": "cmyk",
    "precision": 2,
    "detected_format": "rgb"
  },
  "metadata": {
    "execution_time": 1,
    "color_space_used": "sRGB",
    "colorProperties": {
      "brightness": 133,
      "temperature": "warm",
      "wcagAA": true,
      "wcagAAA": false
    }
  }
}
```

## Practical Application

- CMYK values for print specifications
- Color matching for brand consistency
- Print production workflows

## Key Insights

- Warm orange-red color converts to high magenta/yellow values
- Zero cyan and black values indicate pure warm tone
- Precision of 2 decimal places suitable for print work
