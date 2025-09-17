# EP-133 file formats data

### PADS

```
[
0  0,
1  0,     // INSTRUMENT NUM
2  0,     // INSTRUMENT NUM
3  0,
4  0,     // TRIM LEFT
5  0,     // TRIM LEFT
6  0,     // TRIM LEFT
7  0,
8  0,     // TRIM RIGHT
9  0,     // TRIM RIGHT
10  0,    // TRIM RIGHT
11  0,
12  0,    // TIME STRETCH BPM
13  0,    // TIME STRETCH BPM
14  248,  // TIME STRETCH BPM
15  66,   // TIME STRETCH BPM
16  100,  // VOLUME (0-200)
17  0,    // PITCH (negative: 254-255, zero: 0, positive: 1-12, )
18  0,    // PAN (left: 240-255, center: 0, right: 1-16)
19  0,    // ATACK (0-255), when in KEY/LEG mode
20  255,  // RELEASE (0-255), when in KEY/LEG mode
21  0,    // TIME STRETCH: 0 - OFF, 1 - BPM, 2 - BARS
22  0,    // CHOKE GROUP: 0 - true, 1 - false
23  0,    // PLAY MODE: ONE - 0, KEY - 1, LEG - 2,
24  60,   // PAD ID ?
25  0,    // TIME STRETCH BARS: 0 - 1, 1 - 2, 3 - 4, 255 - 1/2, 254 - 1/4
26  0     // PITCH DECIMAL PART
]
```

### PATTERNS
```
{
    "0": 0,
    "1": 2, // bars
    "2": 8, // notes count
    "3": 0,

    "4": 0,   // position LB
    "5": 0,   // position HB
    "6": 80,  // N / 8 - pad number
    "7": 60,  // note
    "8": 100, // velocity
    "9": 43,  // duration LB
    "10": 0,  // duration HB
    "11": 0,

    "12": 96,
    "13": 0,
    "14": 80,
    "15": 60,
    "16": 100,
    "17": 44,
    "18": 0,
    "19": 245,

    ...
}
```
