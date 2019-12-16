1. Build Oozaru using TypeScript's `tsc`.  The JavaScript modules will be
   compiled into `web/scripts`.

2. Create a directory called `game` inside `web` and drop a Sphere v2 game
   distribution (as built by Cell) into it.  The game must not use the
   Sphere v1 API: Oozaru doesn't support it.

3. Upload the entire contents of the `web` directory to a webserver, or else
   run one locally.  Due to security restrictions in most browsers, the engine
   can't be run directly from `file://`.

4. Navigate to wherever you uploaded Oozaru on the web and test it out!
