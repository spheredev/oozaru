Oozaru Changelog
================

v0.7.0 - TBD
------------

* Adds the new asynchronous `File` APIs.
* Fixes an issue that caused the engine to run too fast on high-refresh-rate
  screens.
* Fixes an issue that caused games that heavily use `Shape.drawImmediate` to
  stutter and drop frames due to high GC pressure.


v0.6.0 - March 23, 2022
-----------------------

* Adds support for the `Color.fromRGBA()`, `Color.EatyPig`, and
  `Transform#matrix` APIs.
* Adds support for the `DataType.JSON` file reading mode.
* Adds static methods to `Transform` for constructing basic matrices.
* Removes support for the `global` binding.
* Removes support for the `JSON.fromFile()` API.


v0.5.1 - January 27, 2022
-------------------------

* Adds support for games that use `Task` instead of `Thread`.
* Removes background-loading support for assets and the corresponding APIs
  (e.g. `whenReady`) added in the previous release.

v0.5.0 - January 5, 2022
------------------------

* Adds support for background-loading `Font`, `Shader`, `Sound`, and `Texture`
  assets via `new`, along with APIs to check when a background-loaded asset is
  ready for use.
* Fixes a bug where HTTP error codes are ignored when fetching files, causing
  requests for nonexistent files to succeed instead of throwing an exception.


v0.4.2 - December 23, 2021
--------------------------

* Adds an overlay notifying the user they have to click to start the engine.
* Adds the ability to click in the rendering area or press a key to start the
  engine.
* Fixes an issue that prevented games using `sphere-runtime` from running in
  non-Chromium browsers.

v0.4.1 - December 21, 2021
--------------------------

* Fixes a bug where `Font` methods would throw errors when passed non-string
  values for `text`.

v0.4.0 - December 18, 2021
--------------------------

* Adds support for loading Sphere v2 games with only an SGM manifest.
* Adds support for launching games targeting API level 3 or under, albeit with
  a warning message printed to the console.
* Adds a metadata file, `oozaru.json`, that external tools can use to identify
  the engine.
* Improves the file loader to show loading progress for more asset types.
* Renames `BufferStream` to `DataStream` and updates the implementation to
  match the one currently used in neoSphere.


v0.3.3 - July 6, 2021
---------------------

* Adds support for `FS.readFile()` to the Core API implementation.
* Adds `BufferStream` to the Sphere Runtime implementation.
* Removes `DataStream` from the Sphere Runtime implementation.

v0.3.2 - November 28, 2020
--------------------------

* Adds a count of files currently being fetched to the Fido indicator.
* Adds a fallback whereby Oozaru will load a game from `./dist` if no game
  index is present on the server.
* Adds a placeholder `Math.random()`-based implementation for the `RNG` class.

v0.3.1 - November 4, 2020
-------------------------

* Adds a cinematic darkening effect for the page background when launching a
  game.
* Adds full support for multiple games via a JSON index in `./games`.
* Removes support for loading games from `./dist`.

v0.3.0 - October 20, 2020
-------------------------

* Adds the ability to load a game from `./dist` instead of having the game
  index hardcoded into the engine.
* Removes support for synchronous loading of assets: `new Texture(filePath)`,
  `new Sound(filePath)`, etc.


v0.2.9 - August 12, 2020
------------------------

* Adds support for importing the Sphere Runtime as `/lib/sphere-runtime.js`.

v0.2.8 - June 11, 2020
----------------------

* Fixes a bug where `SoundStream` playback produces an annoying buzzing noise.

v0.2.7 - May 28, 2020
---------------------

* Fixes a bug where Fido shows incorrect progress for sequential fetches.
* Fixes a bug where text drawn using `Font#drawText` can come out blurry when
  drawn at non-integer coordinates.

v0.2.6 - May 24, 2020
---------------------

* Fixes a bug where the Fido progress percentage could jump around erratically
  while fetching multiple files.

v0.2.5 - February 24, 2020
--------------------------

* Renames `FileStream.open()` to `FileStream.fromFile()` for API parity with
  miniSphere.
* Fixes a bug where `from()` doesn't immediately check whether the source(s)
  passed are nullish, leading to more obtuse errors later.

v0.2.4 - February 19, 2020
--------------------------

* Improves performance of `IndexBuffer#upload()` on macOS.

v0.2.3 - February 15, 2020
--------------------------

* Improves performance when switching back to a shader whose previous matrices
  haven't changed since it was last active.
* Fixes an issue where rendering performance is suboptimal in all browsers on
  macOS.

v0.2.2 - February 9, 2020
-------------------------

* Adds a `start` label under the Sphere logo before a game is launched to
  indicate where to click to start a game.

v0.2.1 - February 8, 2020
-------------------------

* Changes the Sphere logo into a Start button to work around browsers disabling
  audio playback due to no user interaction.
* Fixes a bug where the Fido progress percentage slowly creeps out of sync with
  actual progress as more files are fetched.

v0.2.0 - February 6, 2020
-------------------------

* Adds preliminary support for selecting between multiple games.


v0.1.3 - February 3, 2020
-------------------------

* Adds support for `JobToken#pause()` and `JobToken#resume()`.

v0.1.2 - January 29, 2020
-------------------------

* Fixes a bug where `Esc` keypresses aren't recognized by the engine.

v0.1.1 - January 13, 2020
-------------------------

* Improves readability of crash messages by word-wrapping the exception text.
* Fixes an issue where an uncaught exception thrown while executing Sphere code
  gets caught by the engine and thus may not be intercepted by JS debuggers.

v0.1.0 - January 5, 2020
------------------------

First official Oozaru release.  API parity with miniSphere is passable, but far
from complete. A lot of Sphere v2 code will run as-is, with the caveat that
the browser must support import maps in order to import from `sphere-runtime`.
