BassoonTracker (the real "FL Studio" tracker) is not on npm.

To turn the FL Studio app from a diorama into a REAL .mod/.xm tracker you can
compose in, drop BassoonTracker's built distribution into THIS folder so that:

    public/bassoon/index.html   (+ its js/, css/, skins/, etc.)

exists. The app does a HEAD check on /bassoon/index.html at launch:
  - present  -> loads BassoonTracker in an iframe (the real tracker)
  - absent   -> shows the FruityLoops step-sequencer diorama (current fallback)

Get the build from https://github.com/steffest/BassoonTracker (MIT). Replace the
bundled ST-01/ST-02 Amiga sample disks with free/original samples before
shipping (their license is undocumented). Credit it in CREDITS.md when added.

This file is just documentation; it does not trigger the seam (which looks for
index.html).
