# [bleh for last.fm](https://cutensilly.org/bleh/)

bleh is my passion project and a take on a full [Last.fm](https://last.fm) redesign. It is still a work-in-progress but is entering a very stable state as of recent. If you're interested in what it has to offer along with more screenshots, head to the site above (which has a convenient download link too :3 !!) Community contributions are welcome, please see below!

![preview](https://cutensilly.org/img/bleh3-theme-dark.png)

## Support

If you feel my work on this and my other Last.fm projects is worthy of donations you are welcome to sponsor me on GitHub. This is of course optional and bleh will forever be open-source and free. Sponsors get a sweet profile badge.

## Development

When developing, there are two core components of bleh: the script file and stylesheet file. To get yourself setup after forking the project (and making a new branch if you are contributing), there's some handy steps you can follow.

### Switching bleh into developer mode

In the **Troubleshooting** tab of bleh's settings you can find the toggle "Disable in-built theme loading". This allows you to load the stylesheet and view your changes in realtime. With the **Stylus** extension installed and the bleh repository cloned locally on your device you can drag the `bleh.user.css` file located in the `fm` directory as a new tab and Stylus will present you the ability to live reload changes!

![image](https://github.com/user-attachments/assets/fb9fa4da-488d-424c-92c1-a5b9713990f2)

### Working with the script

Script files can be found in the `build` and `src` directory. `build` files are used for defining global variables and tools, whereas `src` is used for the majority of bleh functionality.

### Building the script

To combine all the separate files into a Tampermonkey-compatible file, run the `build.py` script and it will update the `bleh.user.js` file for use.

---

kate 2022-2025
