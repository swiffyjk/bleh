# [bleh for last.fm](https://bleh.katelyn.moe/)

bleh is my passion project and a take on a full [Last.fm](https://last.fm) redesign. It is still a work-in-progress but is entering a very stable state as of recent. If you're interested in what it has to offer along with more screenshots, head to the site above (which has a convenient download link too :3 !!) Community contributions are welcome, please see below!

![preview](https://bleh.katelyn.moe/img/bleh-ash.jpg)

## Support

If you feel my work on this and my other Last.fm projects is worthy of donations, you are welcome to sponsor me on GitHub. This is, of course, optional, and bleh will forever be open-source and free. Sponsors get a sweet profile badge.

## Development

When developing, there are two core components that make up bleh: the script and the stylesheet. To get yourself set up after forking the project (and making a new branch if you are contributing), here are some handy steps you can follow.

### Switching bleh into developer mode

In the **Advanced** tab of bleh's settings, you can find the toggle "Disable loading of styles". Enabling this setting allows you to load the stylesheet yourself and view your changes in realtime. With the **Stylus** extension installed and the bleh repository cloned locally on your device you can drag the `bleh.user.css` file located in the `fm` directory as a new tab and Stylus will present you the ability to live reload changes!

This setting requires a page reload to take effect.

![image](https://github.com/user-attachments/assets/1f26a7f6-2feb-496e-af70-e0623b134afd)

### Working with the script

Script files can be found in `src`. To combine all the separate files into a loadable bleh install, run `node index.js` in the `fm` directory to update the `bleh.user.js` file for use. For live reloading, use `node index.js dev` instead along with the **Violentmonkey** extension's "track external edits" option.

To convert the working file `bleh.user.css` into the `bleh.css` file used in production, run `node minify.js` and the file will be automatically updated.

## Licenses

This project includes the 'Overpass' font as woff2 files which is licensed under the SIL Open Font License 1.1. See fonts/LICENSE for details.

---

made with [♡](https://katelyn.moe/sponsor) by katelyn and contributors
