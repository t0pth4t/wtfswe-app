WTFSWE
=====================


App created to take the stress out of figuring out where the eff you and or your partner should eat tonight...


* cordova build --release android
* cd platforms\android\ant-build
* jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore C:\my-release-key.keystore myapp-release-unsigned.apk alias_name
* C:\androidsdk\androidsdk\sdk\build-tools\android-4.4W\zipalign -v 4 myapp-release-unsigned.apk myapp.apk