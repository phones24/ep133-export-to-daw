# EP-133 K.O. II: Export To DAW

This tool allows you to export your EP-133 K.O.II (EP-1320) project into a DAW (Digital Audio Workstation).

Try it out on https://ep133-to-daw.cc/

## Motivation

If you’ve been producing with the EP-133 (or EP-1320), you already know the frustration: there’s no clear way to export your projects directly into a DAW.
The official EP Sample Tool only lets you manage samples and backups. That’s it.

Sure, you could record MIDI notes or capture audio track by track, but it’s slow, tedious, and not fun.

At some point, I started digging through the backup files created by Sample Tool and realized there is the way to get data/notes/settings/etc. The EP-133 actually has its own internal filesystem. Everything - projects, notes, settings - is stored there, and the backup tool simply copies these files into an archive when backing up.

So I started digging through the file format and trying to reuse the logic from the Sample Tool, since Teenage Engineering doesn’t publish its source code.
I spent a lot of time de-obfuscating it (AI helps a lot there), reverse-engineering the files, and eventually building a working library (check src/ep133 folder).
Then building the web application was easy.

## Description

Supported formats are:

- DAWproject
- MIDI

**Unfortunately, the DAWproject format does not currently support the "Sampler" device, so you will need to manually assign the samples in your DAW.**

## TODO
- export to Ableton Live
- fix heavy CPU utilization

## Help and support

Please feel free to open an Issues or drop your ideas in the Discussions.


## Donate

If you like this tool, please consider donating to support the development.
Use "Donate" button on the [website](https://ep133-to-daw.cc/).

Or here directly to Ko-fi:

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/M4M11KIZGJ)
