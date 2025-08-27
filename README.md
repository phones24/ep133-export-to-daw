# EP-133 K.O. II: Export To DAW

This is the tool that allows you to export your EP-133 K.O.2 project to DAW (Digital Audio Workstation).
Currently supporting format is DAWproject (https://github.com/bitwig/dawproject).

## Motivation

If you’ve been producing with the EP-133 (or EP-1320), you already know the frustration: there’s no clear way to export your projects directly into a DAW.
The official EP Sample Tool only lets you manage samples and backups. That’s it.

Sure, you could record MIDI notes or capture audio track by track, but it’s slow, tedious, and not fun.

At some point, I started digging through the backup files created by Sample Tool and realized there is the way to get data/notes/settings/etc. The EP-133 actually has its own internal filesystem. Everything - projects, notes, settings - is stored there, and the backup tool simply copies these files into an archive when backing up.

So I started digging through the file format and trying to reuse the logic from the Sample Tool, since Teenage Engineering doesn’t publish its source code.
I spent a lot of time de-obfuscating it (AI helps a lot there), reverse-engineering the files, and eventually building a working library (check src/ep133 folder).
Then building the web application was easy.

## Description

What exported:
- bpm
- patterns/clips
- samples (as wav files in archive)

*Unfortunately, DAWproject currently not supporting "Sampler" device, which means you need to assign the samples yourself in your DAW.*

## TODO
- export to Ableton Live
- export to MIDI


## Help and support

Please feel free to open an Issue or drop your ideas in the Discussions.
