# Paragliding wind lamp
## FlyLight
 
Our basic idea was to parse live wind data from Holfuy weather stations and return a green or red light if the wind is flyable or not at our local paragliding site. We use a normal lamp socket from IKEA and a special lightbulb system that can change color. 
 
The code is written in JavaScript and can be run on most operating systems. We use a cheap Raspberry Pi in the following example.
 
## This is the hardware we use:
 
- Raspberry Pi 2 model B https://www.komplett.se/raspberry-pi-2-model-b/836890
- MiLight lightbulb http://www.ebay.com/itm/151585053073
. MiLight wifi controller http://www.ebay.com/itm/321496088479
- Lamp with a E14 socket. http://www.ikea.com/se/sv/catalog/products/90242189/
- MicroSD card (4GB or bigger)
- Micro USB cable for power to the Raspberry
- Ethernet cable
- Optional: Plastic case for the Raspberry http://www.ebay.com/itm/281657279473
 
 
## How to setup the system:
 
Follow the instructions on how to write the raspian disk image to your SD-card.
Boot your Raspberry and make sure it is connected to the Internet. You don't need a monitor and keyboard connected to the raspberry to do this. You can find plenty of guides on the Internet to do all this. Here is a good source:
http://www.robertawood.com/blog/raspberry-pi/raspberry-pi-initial-setup-headless-no-monitor-or-keyboard-needed.html
 
Once the Raspberry is installed, ssh to your internet connected Pi and install the following packages:
 
sudo apt-get install npm
curl -sLS https://apt.adafruit.com/add | sudo bash
sudo apt-get install node
sudo apt-get install git
 
Make sure that you are in a suitable catalog i.e. cd /home/pi 
Install our FlyLight software with the following command:
sudo git clone https://github.com/bofh69/FlyLight.git
 
Edit the config file and add your weather station(s).
sudo nano /home/pi/FlyLight/config.json
 
Save the file. You can now check if the server is working by running:
node /home/pi/FlyLight/server.js
 
If you want to make sure that the server is booting automatically when you reboot your Raspberry, add this line to your /etc/rc.local file.
su pi -c 'node /home/pi/FlyLight/server.js < /dev/null &'
 
The final step is to setup the MiLight LED-lamp and WiFi bridge.
Follow the instructions in this document:
http://www.limitlessled.com/download/LimitlessLED_Wifi_Bridge_v4_Instructions_March2014.pdf
 
Our software will use the broadcast address to communicate with the WiFi bridge instead of a specific IP-address. This is good if your Raspberry and bridge are connected to the same network. You can specify a static address in config.json but there is no easy way to give the WiFi bridge a static address. One way to solve this is if you have a home router that can give out a "static" DHCP address based on MAC-address. This is one way to make sure that the WiFi bridge will end up with the same IP-address after a reboot.

## Prebuilt image for the Raspberry PI
A prebuilt image can be downloaded from:
https://copy.com/WicKPfG0EIj39ZZ7
 
Happy flying and let the green light shine bright :)
