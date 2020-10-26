1. Build Oozaru using TypeScript's `tsc`.  The JavaScript modules for the
   engine will be compiled into `web/oozaru`.

2. Create a directory called `dist` inside `web` and drop a Sphere v2 game
   distribution (as built by Cell) into it.  Note that Oozaru doesn't support
   the Sphere v1 API, so your game must only use v2 classes and functions.

3. Upload the entire contents of the `web` directory to a webserver, or else
   run one locally.  Due to security restrictions in most browsers, the engine
   can't be run directly from `file://`.

4. Navigate to wherever you uploaded Oozaru on the web and test it out!
