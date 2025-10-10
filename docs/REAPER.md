Original document found here: https://web.archive.org/web/20250227145458/https://wiki.cockos.com/wiki/index.php/State_Chunk_Definitions

# State Chunk Definitions

### From CockosWiki

This page details what is known about various state chunk definitions such as are returned by API functions `GetSetTrackState()`, `GetSetItemState()` and `GetSetEnvelopeState()`. There are still some question marks (gaps) in the definitions and several plugin formats are completely undocumented so please fill in any gaps you can. Thanks to all who have spent time poking around these things. It's a tedious business.

*Please note that comments, empty lines and indentation are for illustration only.*

*For the sake of formatting, the following changes have been made:*

- *Float values with fourteen decimal places have been condensed to three decimal places.*
- *Float values with ten decimal places have been condensed to two decimal places.*
- *Float values with six decimal places have been condensed to one decimal place.*
- *The shorthand "int (bool)" has been used to denote "0 = False, 1 = True"*

*TODO:*

- *Separate item source properties (including other item types) into their own block.*
- *Split this page into separate pages keep this one as the chunk index*
- *Link to this page from GetSetWhateverState() pages and remove chunk definitions from those pages*

---

## Track

The Track state chunk contains all the settings for a track and all of it's items, envelopes, receives, plugins etc.

```text
<TRACK                                                        // Start of Track definition
    NAME "Aural sax"                                          // Track name
    PEAKCOL 16576                                             // Peak colour (items and takes override?)
    BEAT -1                                                   // Track timebase (-1 = project default)
    AUTOMODE 0                                                // Automation mode
                                                              //   0 = Trim/Read
                                                              //   1 = Read
                                                              //   2 = Touch
                                                              //   3 = Write
                                                              //   4 = Latch
    VOLPAN 0.359 0.000 -1.000                                 // Volume/Pan
                                                              //  field 1, float, track volume
                                                              //  field 2, float, track pan
                                                              //  field 3, float, track pan law
    MUTESOLO 0 0 0                                            // Mute/solo
                                                              //  field 1, int (bool), mute
                                                              //  field 2, int, solo, 0= no solo, 1 = solo, 2 = solo-in-place
                                                              //  field 3, int (bool), solo defeat
    IPHASE 0                                                  // Invert phase, int (bool)
    ISBUS 0 0                                                 // ??, Unknown but related to folder tracks
                                                              //   1 1 = is folder, 2 -1 = is folder end, 0 0 for others
    BUSCOMP 0 0                                               // Collapse folder (bus compact?)
                                                              //  field 1, int, 0=full, 1=medium, 2=small
                                                              //  field 2, int, show/hide for Mixer: Clickable icon for folder tracks to show/hide children
    SHOWINMIX 1 0.6 0.5 1 0.5 -1 -1 -1                        // Show In Mixer
                                                              //  field 1, int (bool), show in mixer
                                                              //  field 2, float, ??
                                                              //  field 3, float, ratio of sends section height
                                                              //  field 4, int (bool), show in track list
                                                              //  field 5, float, ??
                                                              //  field 6, int, ??
                                                              //  field 7, int, ??
                                                              //  field 8, int, ??
    FREEMODE 0                                                // Free Item Positioning Mode, int (bool)
    REC 0 0 0 0 0 0 0                                         // Record settings
                                                              //  field 1, int (bool), armed
                                                              //  field 2. int, input,
                                                              //    0=mono left, 1=mono right, 1024=stereo left+right...
                                                              //    device + channel(s) coded via unknown bitwise method
                                                              //  field 3. int, monitor, 0=off, 1=on, 2=auto
                                                              //  field 4. int, record mode,
                                                              //   0=input, 1=output (stereo), 2=disable(monitor),
                                                              //   3=output (stereo, latency comp), 4=Output (MIDI),
                                                              //   5=output (mono), 6=output (mono, latency comp),
                                                              //   7=MIDI overdub, 8=MIDI replace, 9=MIDI touch replace,
                                                              //   10=output (multichannel),
                                                              //   11=output (multichannel, latency comp)
                                                              //  field 5. int (bool), monitor track media while recording
                                                              //  field 6. int (bool), preserve PDC delayed monitoring
                                                              //  field 7. int, record path, 0=primary, 1=secondary, 2=both
    TRACKHEIGHT 0 0                                           // Height in TCP,
                                                              //  field 1, int, height in pixels
                                                              //  field 2, int (bool), folder override (collapsed)
    INQ 0 0 0 0.50 100 0 0 100                                // Input quantize settings
                                                              //  field 1, int (bool), quantize midi
                                                              //  field 2, int, quantize to pos (-1=prev, 0=nearest, 1=next)
                                                              //  field 3, int (bool), quantize note-offs
                                                              //  field 4, float, quantize to (fraction of beat)
                                                              //  field 5, int (%), quantize strength
                                                              //  field 6, int (%), swing strength
                                                              //  field 7, int (%), quantize range min
                                                              //  field 8, int (%), quantize range max
    NCHAN 2                                                   // Number of track channels, int
    <RECCFG 1                                                 // Recording format data. Not present if not changed.
        dmdnbwAAAD8AgAAAAIAAAAAgAAAAAAEAAA==                  //  binary data, leave it alone
    >                                                         //
    FX 1                                                      // FX state, int, 0=bypassed, 1=active
    TRACKID {5619EDC5-E743-4BE8-AE9F-3B3469A111B5}            // REAPER track id, leave it alone
    PERF 0                                                    // Performance options, int (bitwise)
                                                              //  val & 1 = prevent media buffering
                                                              //  val & 2 = prevent anticipative fx

                                                              // --- Start of receive data ---
                                                              //     One for each receive or not present if no receives
    AUXRECV 2 1 1.000 0.000 0 0 0 2 0 1.000 80 1              // First receive
                                                              //  field 1, int, source track index (zero based)
                                                              //  field 2, int, mode
                                                              //    0 = Post Fader (Post Pan)
                                                              //    1 = Pre FX
                                                              //    3 = Pre Fader (Post FX)
                                                              //  field 3, float, volume
                                                              //  field 4, float, pan
                                                              //  field 5, int (bool), mute
                                                              //  field 6, int (bool), mono sum
                                                              //  field 7, int (bool), invert phase
                                                              //  field 8, int, source audio channels
                                                              //    -1 = none, 0 = 1+2, 1 = 2+3, 2 = 3+4 etc.
                                                              //    probably different if non-standard pairs aren't allowed
                                                              //  field 9, int, dest audio channels (as source but no -1)
                                                              //  field 10, float, panlaw
                                                              //  field 11, int, midi channels
                                                              //    source = val & 0x1F (0=None), dest = floor(val / 32)
                                                              //  field 12, int, automation mode (-1 = use track mode)

                                                              // --- Start of envelope definitions for the above receive
                                                              //     One definition block for each non-empty envelope.
                                                              //     See GetSetEnvelopeState() for full envelope definition.
    <AUXPANENV                                                //  Start of first receive envelope
        (see chunk info below)                                //   ...
    >                                                         //  End of first receive envelope
    <AUXMUTEENV                                               //  Start of second receive envelope.
        (see chunk info below)                                //   ...
    >                                                         //  End of second receive envelope
	                                                          // --- End of envelopes for first receive

    AUXRECV 3 0 1.000 0.000 0 0 0 0 0 -1.000 0 -1             // Second track receive settings (as above but no envelopes)
                                                              // --- End of receive data ---

    MIDIOUT -1                                                // MIDI hardware output settings. int (bitwise)
                                                              //  device = floor(val / 32)
                                                              //    index of device (inc. ignored devices)
                                                              //    -1 for no MIDI hardware output
                                                              //  channel = val & 0x1F
                                                              //    channel number or 0 for 'use original'
                                                              //    val = device * 32 + channel (device 2, ch 4 == 68)
    MAINSEND 1                                                // Master/parent send, int (bool)

                                                              // --- Start of track envelopes ---
                                                              //     One definition block for each non-empty envelope.
                                                              //     See GetSetEnvelopeState() for full envelope definition.
    <VOLENV2                                                  //   First track envelope.
        (definition removed)                                  //   ...
    >                                                         //   End of first track envelope
                                                              // --- End of track envelopes

                                                              // --- Start of FX section ----
    <FXCHAIN                                                  //     Not present if track hasn't got/had FX ---
        (see chunk info below)
    >                                                         // --- End of FX section

                                                              // --- Start of item definitions ---
    <ITEM                                                     // First item definition
        (see chunk info below)
    >                                                         // End of first item
                                                              // --- End of item definitions

>                                                             // End
```

## Audio Item

```text
<ITEM                                                   // Item section start
    POSITION 0.000                                      // Position on the timeline, in seconds
    SNAPOFFS 0.000                                      // Snap offset, in seconds
    LENGTH 145.500                                      // Item length, in seconds
    LOOP 0                                              // Loop source int (bool)
    ALLTAKES 0                                          // Play all takes int (bool)
    COLOR 22278759                                      // Item colour, int , Not present if not set.
    BEAT 0                                              // Item timebase, int, Not present if not set. -1 = use track timebase
    SEL 1                                               // Is the item selected? int (bool)
    FADEIN 1 0.0 0.0                                    // Fade in settings
                                                        //  field 1, int, fade in curve type (0 - linear, etc.)
                                                        //  field 2, float, fade in time (in seconds)
                                                        //  field 3, float, autocrossfade length
                                                        //  field 4, float, ? (bool)
                                                        //  field 5, float, autocrossfade is on
                                                        //  field 6, float, fade shape
    FADEOUT 1 0.0 0.0                                   // Fade out settings (same as fade in above)
                                                        //  ...
                                                        //  ...
                                                        //  ...
    MUTE 0                                              // Is the item muted? int (bool)
    FADEFLAG 1                                          // ??, int, may not be present
    IGUID {98E8ECDE-FF4D-4E06-87ED-43A5E7E6A61A}        // Item id. Leave it alone
                                                        // --- From this point, values mostly relate to the first take
                                                        //     except for field 1 of VOLPAN which is the item trim
    NAME "The first take"                               // First take name
    VOLPAN 1.0 0.0 1.0 -1.0                             // Volume and pan settings
                                                        // field 1, float, item trim
                                                        //   1.00 = 0 dB
                                                        //   16.00 = +24 dB
                                                        //   0.50 = -6 dB
                                                        // field 2, float, first take pan, -1.00 = left, 1.00 = right
                                                        // field 3, float, first take volume (other takes in TAKEVOLPAN below)
                                                        // field 4, float, first take pan law
    SOFFS 0.000                                         // First take slip offset (in seconds)
    PLAYRATE 1.000 1 0.000 -1                           // First take playrate settings
                                                        //  field 1, float, playrate
                                                        //  field 2, int (bool), preserve pitch while changing rate
                                                        //  field 3, float, pitch adjust, in semitones.cents
                                                        //  field 4, int, pitch shifting/time stretch mode and preset
                                                        //    -1 - project default
                                                        //    0-2 - Sound Touch (3 presets)
                                                        //    65536-65567 - Dirac LE (32 presets)
                                                        //    131072-131119 - Low quality windowed (48 presets)
                                                        //    196608-196639 - élastique Pro (32 presets)
                                                        //    262144-262147 - élastique Efficient (4 presets)
                                                        //    327680-327683 - élastique SOLOIST (4 presets)
                                                        //    393216-393247 - élastique 2.1 Pro (32 presets)
                                                        //    458752-458755 - élastique 2.1 Efficient (4 presets)
                                                        //    524288-524291 - élastique 2.1 SOLOIST (4 presets)
    CHANMODE 0                                          // First take channel mode, int
                                                        //   0 = normal, 1 = reverse stereo, 2 = mono (downmix)
                                                        //   3 = mono (left), 4 = mono (right)
    GUID {4EB7779B-D570-4CCF-8739-161D2D32C154}         // First take id. Leave it alone
    <SOURCE SECTION                                     // Source section start (only present when changed in Item properties)
        LENGTH 0.000                                    // Section length
        MODE 3                                          // Mode, 2 = Section and Reverse, 3 = Reverse
        STARTPOS 0.000                                  // Section start offset (in seconds)
        OVERLAP 0.010                                   // Section crossfade (in seconds)
        <SOURCE WAVE                                    // Source details. Appears alone if SOURCE SECTION not set
            FILE "C:Path\To\AudioFile.wav"              // Source file.
        >                                               // Source details end
    >                                                   // Source section end

    TAKE SEL                                            // Second take start. SEL only appears if this take is selected
    NAME "The second take"                              // Take name
    TAKEVOLPAN 0.0 1.0 -1.0                             // Take volume and pan settings
                                                        //  field 1, float, take pan
                                                        //  field 2, float, take volume
                                                        //  field 3, float, take pan law
    SOFFS 0.000                                         // Take slip offset (in seconds)
    PLAYRATE 1.000 1 0.000 -1                           // see PLAYRATE above
    CHANMODE 1                                          // see CHANMODE above
    GUID {4EB7779B-D570-4CCF-8739-161D2D32C154}         // Take id. Leave it alone
    <SOURCE WAVE                                        // Take source details
    FILE "C:\Full\Path\To\AudioFile reversed.wav"       // Source filename
    >                                                   // Source section end
>                                                       // Item section end
```

## MIDI Item

```text
One example is below, but more info can be found in the [[StateChunkAndRppMidiFormat]] page.
<pre>
<ITEM                                                   // Item section start
    POSITION 12.000                                     // see Audio item state chunk above
    SNAPOFFS 0.000                                      // ...
    LENGTH 8.815                                        // ...
    LOOP 1                                              // ...
    ALLTAKES 0                                          // ...
    SEL 1                                               // ...
    FADEIN 1 0.0 0.0                                    // ...
    FADEOUT 1 0.0 0.0                                   // ...
    MUTE 0                                              // ...
    IGUID {967EE770-4144-472A-89D6-B72BB910A916}        // ...
    NAME "MIDI item"                                    // ...
    VOLPAN 1.0 0.0 1.0 -1.0                             // ...
    SOFFS 0.000 0.000                                   // Slip offset (in seconds; the second field is always twice the first field)
    PLAYRATE 1.000 1 0.000 -65536                       // ...
    CHANMODE 0                                          // ...
    GUID {9C93A652-09A2-4A46-9E1B-EF83EB7CED29}         // ...
    <SOURCE MIDI                                        // Source section start
        HASDATA 1 960 QN                                // Does the item have any data? PPQ resolution in ticks per quarter note
        e 300 90 2b 60                                  // Standard MIDI message
                                                        //  field 1, e - selected, E - not selected
                                                        //  field 2, int, msg start offset
                                                        //  field 3, MIDI status byte (message type + channel number)
                                                        //    0x80 = Note Off, channel 0
                                                        //    0x9F = Note On, channel 15
                                                        //    0xB4 = Control Change, channel 4
                                                        //  field 4, Data1, depends on the message type (eg. note number)
                                                        //  field 5, Data2, depends on the message type (eg. velocity)
        e 60 80 2b 00                                   // selected msg, offset 60, note off, note 2b, velocity 0
        <X 286306 0                                     // SysEx section start (SysEx midi message, variable length)
                                                        //  field 1, x - selected, X - not selected
                                                        //  field 2, ??
                                                        //  field 3, ??
          8AECAwQF9w==                                  // (Base64 encoded)
        >                                               // SysEx section end
        E 540 b0 7b 00                                  // unselected msg, offset 540, Control Change , all notes off (cc123)
        GUID {9DAB52C8-6257-4A4E-9E60-323514C0DB9B}     // Take id
        IGNTEMPO 0 120.00000000 4 4                     // Ignore project tempo, override with new settings
                                                        //  field 1, int, ignore on/off
                                                        //  field 2, float, tempo used to override project tempo
                                                        //  field 3-4, int, time signature to override project time signature
        VELLANE 128 97 0                                // Velocity/CC lane settings
                                                        //  field 1, int, lane type
                                                        //    -1 = velocity
                                                        //    0-119 = CC #0 - CC #119
                                                        //    128 = pitch bend
                                                        //    129 = program
                                                        //    130 = channel pressure
                                                        //    131 = bank/program select
                                                        //    132 = text events
                                                        //    133 = sysex
                                                        //  field 2, int, height of the lane in MIDI editor mode
                                                        //  field 3, int, height of the lane in inline editor mode
        BANKPROGRAMFILE "C:\Path\To\GM.reabank"         // Path to ReaBank file used by the current item
        CFGEDITVIEW 3787.8 0.1 0 48 0 0 0               // Somehow related to H/V zoom levels and scrollbar positions
        CFGEDIT 1 1 0 1 1 16 1 1 1 1 1 0.06250000 0 0   // MIDI editor window configuration data
        1024 768 0 2 0 0 0.00000000 0 0                 //  field 1, int, ??
                                                        //  field 2, int (bool), sync editor transport to project transport
                                                        //  field 3, int, ??
                                                        //  field 4, int (bool), show velocity handles
                                                        //  field 5, int (bool), show note names
                                                        //  field 6, int, MIDI editor view mode
                                                        //    0  = piano roll, rectangle
                                                        //    1  = named notes, rectangle
                                                        //    5  = event list, rectangle
                                                        //    8  = piano roll, triangle
                                                        //    9  = named notes, triangle
                                                        //    13 = event list, triangle
                                                        //    16 = piano roll, diamond
                                                        //    17 = named notes, diamond
                                                        //    21 = event list, diamond
                                                        //  field 7, int, ??
                                                        //  field 8, int (bool), move CCs with notes
                                                        //  field 9, int, ??
                                                        //  field 10, int (bool), snap to grid
                                                        //  field 11, int (bool), show grid
                                                        //  field 12, float, grid division unit, in beats.ticks
                                                        //  field 13, field 14, int, X and Y coords of upper left corner of ME window
                                                        //  field 15, field 16, int, X and Y coords of bottom right corner of ME window
                                                        //  field 17, int (bool), dock editor window
                                                        //  field 18, int, note row view modes
                                                        //    0 = show all rows
                                                        //    1 = hide unused rows
                                                        //    2 = hide unused and unnamed rows
                                                        //  field 19, int, state of Timebase setting
                                                        //    0 = project beats
                                                        //    1 = project sync
                                                        //    2 = project time
                                                        //    4 = source beats
                                                        //  field 20, int, state of Color mode setting
                                                        //    0 = velocity
                                                        //    1 = channel
                                                        //    2 = pitch
                                                        //    4 = source
                                                        //  field 21, float, length of last drawn note in beats.ticks
                                                        //  field 22, int, re-use editor window
                                                        //    0 = off
                                                        //    1 = re-use MIDI editor window
                                                        //    2 = re-use MIDI editor window, keeping current item secondary
                                                        //  field 23, int (bool), show velocity numbers
        EVTFILTER 0 -1 -1 -1 -1 0 1                     // Event filter settings
                                                        //  field 1, int (16-bit mask), state of channel checkboxes
                                                        //    0000000000000000 (0)     - "All" is checked, 1-16 unchecked
                                                        //    1111111111111111 (65536) - "All" is checked along with 1-16
                                                        //    1000000000000001 (32769) -  1 (LSB) and 16 (MSB) are selected
                                                        //    etc.
                                                        //  field 2, int, Event type
                                                        //    -1  = <all>
                                                        //    144 = Note
                                                        //    160 = Poly Aftertouch
                                                        //    176 = Control Change (CC)
                                                        //    192 = Program Change (PC)
                                                        //    208 = Channel Aftertouch
                                                        //    224 = Pitch
                                                        //    240 = Sysex/Meta
                                                        //  field 3, int, parameter field (range: 0-127)
                                                        //  field 4, int, value Low field (range: 0-127)
                                                        //  field 5, int, value High field (range: 0-127)
                                                        //  field 6, int, draw events on channel setting (range: 0-15)
                                                        //  field 7, int (bool), enable filter
    >                                                   // Source section end
>                                                       // Item section end
```

MIDI Event -> field 2 above... This is the number of ticks (it's ok, I'll tell you in a minute) since the last event or (if this is the first MIDI Event) the start of the Item.

Ticks then. A tick is a small slice of a beat, so the number of Ticks per second varies with the BPM (Beats Per Minute) of the music.

1 beat = 2.6041666666666666666666666666667e-4 \times 240 \times 16

1 beat = 2.6041666666666666666666666666667e-4 * 240 * 16

The MIDI format used in REAPER State Chunks and .rpp files is documented here State Chunk And RPP MIDI Format.




## Envelope

Envelopes appear to share most of their characteristics though there may be some differences in how point values are used. Needs more testing

Envelope types include:

- VOLENV - Track (pre FX)/Take volume (0.0 to 2.0)
- VOLENV2 - Track (post FX) volume (0.0 to 2.0)
- PANENV - Track (pre FX)/Take pan (-1.0 to 1.0)
- PANENV2 - Track (post FX) pan (-1.0 to 1.0)
- MUTEENV - Track mute (0.0 to 1.0)
- AUXVOLENV - Receive volume (0.0 to 2.0?)
- AUXPANENV - Receive pan (-1.0 to 1.0)
- AUXMUTEENV - Receive mute (0.0 to 1.0)
- PARMENV - Plugin parameter (value range defined by additional parameters after type tag)
- TEMPOENVEX - Master tempo


```text
<VOLENV2                            // Type. PARMENV has additional fields on this line (see below)
    ACT 1                           // Active, int (bool)
    VIS 1 1 1.0                     // Visibility
                                    //   field 1, int (bool), visible
                                    //   field 2, int (bool), show in lane
                                    //   field 3, float, ??
    LANEHEIGHT 0 0                  // Lane height
                                    //   field 1, int, height in pixels
                                    //   field 2, int, ??
    ARM 1                           // Armed, int (bool)
    DEFSHAPE 0                      // Default point shape, int
                                    //   0 = Linear
                                    //   1 = Square
                                    //   2 = Slow Start/End
                                    //   3 = Fast Start
                                    //   4 = Fast End
                                    //   5 = Bezier

    PT 3.000000 -0.2 5 0 0 0 -0.7   // Envelope point definition
                                    //  field 1, float, position (seconds)
                                    //  field 2, float, value
                                    //  field 3, int, shape (-1 = envelope default?)
                                    //  field 4, int, optional, ?? (TEMPOENVEX time sig? check this)
                                    //  field 5, int (bool), selected (optional)
                                    //  field 6, int, ?? (optional)
                                    //  field 7, float, bezier tension (optional)
>```

PARMENV contains extra data denoting which plugin parameter is controlled and what the minimum, maximum and default values are.

```text
<PARMENV 1 0.0 1469.0 734.5         // Type
                                    //  field 1, int, param index - zero based top to bottom.
                                    //    REAPER tags additional bypass and wet params onto the end, in that order
                                    //  field 2, float, minimum value
                                    //  field 3, float, maximum value
                                    //  field 4, float, center/default value
   /* snip */
>
```


## Track/Take FX

Plugin chains appear to be the same for both tracks and item takes, with the exception that the chunk name is different.

```text
    <FXCHAIN                                                  // FXCHAIN for track or TAKEFX for take
    WNDRECT 0 42 716 227                                      // FX Window position
                                                              //  field 1, int, top
                                                              //  field 2, int, left
                                                              //  field 3, int, width
                                                              //  field 4, int, height
    SHOW 0                                                    // Show FX window, int (bool)
    LASTSEL 1                                                 // Index of selected plugin (zero based), int
    DOCKED 0                                                  // FX window is docked, int (bool)

                                                              // --- Start of first plugin definition
    BYPASS 0 0 0                                              //  Plugin bypass state
                                                              //   field 1, int (bool), bypassed
                                                              //   field 2, int (bool), offline
                                                              //   field 3, int (bool), set if plug-in is
                                                              //      offline and should be floated when brought back online
    <VST "VST: SomePlugin" "SomePlugin.dll" 0 "Sax offender"  //  Plugin data
        (see VST(i) plugin info below)                        //
    >                                                         //
    FLOATPOS 0 0 0 0                                          //  Plugin floating window pos, int (top, left, width, height)
    FXID {1191A7FE-F583-477E-8416-D9F0F58226CD}               //  Plugin id, leave it alone

                                                              //  --- Start of parameter envelopes for this plugin.
                                                              //      One block for each non-empty envelope.
    <PARMENV 2 0.0 1.0 0.5                                    //  First parameter envelope
        (see envelope chunk info)                             //
    >                                                         //
                                                              //  --- End of parameter envelopes

    PARM_TCP 4 2 0                                            //  Params visible on TCP/MCP.
                                                              //   List of int indexes separated by spaces.
    WAK 0                                                     //  int, ??
    <COMMENT                                                  //  Plugin comment. Not present if no comment.
        Y29tbWVudA==                                          //   Binary data, probably best to leave it alone
    >                                                         //

                                                              // --- Start of second plugin definition
    BYPASS 0 0 0                                              //  ...
    <JS "Guitar/tremolo" ""                                   //  Start of JS plugin data
        (see Jesusonic plugin info below)                     //
    >                                                         //
    FLOATPOS 0 0 0 0                                          //  ...
    FXID {BE5D3334-6675-4DAD-AFDD-F4489878D82A}               //  ...
    WAK 0                                                     //  ...
    <COMMENT                                                  //  ...
        Y29tbWVudA==                                          //  ...
    >                                                         //  ...

    >                                                         // --- End of FX section

```

## VST(i) Plugin

```text
    <VST "VST: SomePlugin" "SomePlugin.dll" 0 "Sax offender"  //  Start of VST plugin data
                                                              //   field 1, str, default name
                                                              //   field 2, str, filename
                                                              //   field 3, int, ??
                                                              //   field 4, str, display name (default used if empty)
    RmFkbe9e7f4CAAAAAQAAAAAAAAACAAAAAAAAAAIAAAABAAAAAAAAAA==  //  Binary data, leave it alone (variable number of lines)
    AgAAAAAAAAAwAAAAAAAAAAAAEADvvq3eDfCt3sP1qD4zMzM/AAAAPw==  //
    mplZPwAAAAAAAAA/MzMzP83MzD4AAAAAAABAP1Jlc29uYW50IEZpbA==  //
    dGVyAA==                                                  //
    >                                                         //  End of VST plugin data
```

## Jesusonic Plugin

For the sake of formatting, the plugin data has been truncated.

```text
    <JS "Guitar/tremolo" ""                                   //  Start of JS plugin data
                                                              //   field 1, str, filename
                                                              //   field 2, str, display name (filename used if empty)
        4.0 -6.0 0.0 - - - - - - - - - - - - - - - - - - - -  //  Data, 64 fields of float or '-' separated by spaces
    >                                                         //  End of JS plugin data
```

