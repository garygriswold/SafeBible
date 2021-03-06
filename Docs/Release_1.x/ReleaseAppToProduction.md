This document is mostly obsolete as of July 2018.  It was about App release under Cordova, 
and now the releases are done using xCode and Android Studio, which makes them very simple.


Preparation for Release
=======================
	
	cd BibleApp/YourBible
	vi config.xml 
	update version to the correct number

### The following relates to keys used on the server by QA feature, 
### which has not been implemented.	
### Encryption keys to be used for DigitalSignature of requests must be
### updated for the new version.
### 	
### 	cd $HOME/BibleCred/AppAuth
### 	vi GenCredentials.sh
### 	insert new key for the new version
### 	./GenCredentials.sh
### 	./DeployCredentials.sh
### 	
### Verify that the addition of a key was the only change, and checkin the changes

	git status
	git difftool
	git commit -am"comment"

	
Deploy iOS Production Version
=============================

Create new Certificate and Provisions (if they have expired)
-------------------------------------

I must have a current Distribution certificate and provisioning profile.
These can be created at the following Apple WebSite using instructions
that you can find there.

It is critical to keep separate the various Apple Identifies
	
	95C7NX5DGM - Short Sands, LLC
	4U62ERFA4L - Gary N Griswold
	SDDE5M4NHR - ECS Ministries
	
	https://developer.apple.com/account/#/overview/95C7NX5DGM
	
	Create a Production App Store Certificate using instruction at above website
	Create a Production provisioning file using instructions at the above website
	Enter the current information into build.json file
	
	Note: On 1/18/18, it was necessary to set XCode to manual signing for the
	production build, but set it to automatic signing for development.

### 	Distribution Certificate and Distribution Profiles must
### 	be created on the Apple Developer website, and then installed
### 	on the keychain on one's Mac.  Then these will be installed
### 	automatically during the compilation of the production
### 	version of the App.  The section "Signing The App Manually"
### 	only needs to be done when certificates are expired.
### 
### The following sections is obsolete. It was written about 2015	
### Signing The App Manually
### ------------------------
### 
### The Release version of the App has been signed using the following tools.  It could also have been signed by various development environment.
### 
### Log into into the Apple developer center
### 
### 	http://developer.apple.com
### 	username: gary@shortsands.com
### 	password: Br1......
### 	Click on "Certificates, Identifiers, and Profiles"
### 	
### Generate and download a Certificate
### 
### 	Generate an "iOS Distribution Certificate" if the current one is nearly expired
### 	Download
### 	cp iso_distribution.cer $HOME/BibleApp/YourBible/certificates/ios
### 	
### 	
### Generate an Identifier using the current certificate, if a new certificate was created
### 
### 	Your Bible com.shortsands.yourbible - is the current identifier
### 	
### Generate and download an iOS Distribution Profile
### 
### 	YourBible_2016_01_13 is the current provisioning profile
### 	It must reference the certificate and identifier above
### 	Download
### 	cp YourBible_2016_01_13.mobileprovision $HOME/BibleApp/YourBible/certificates/ios
	
Compile and Sign App
--------------------

Make certain it has a fresh copy of Versions.db and the correct versions installed:
ERV-ENG, ERV-ARB, NMV

	cd $HOME/ShortSands/BibleApp/Versions
	./RunVersions.sh

Verify that IOS-Deployment-Target is 8.0 in xCode

##Make Certain that App is hitting a production server
##
##	BibleApp/Library/io/FileDownloader.js
##	this.host = 's3.amazonaws.com';
##
Update the version code

##	vi $HOME/ShortSands/BibleApp/YourBible/config.xml
	xCode
	
##Rebuild the Custom Plugins to iphone Release
##
##	1. Rebuild each of 3 plugins
##	2. InstallVideoModule.sh
##	3. build_ios.sh Release
##	
##Compile your app in release mode to obtain a signed IPA.
##
##	cd $HOME/ShortSands/BibleApp/YourBible
##	cordova build ios --release --device
##	Note location of IPA, currently: /Users/garygriswold/ShortSands/BibleApp/YourBible/platforms/ios/build/device/SafeBible.ipa
##	
##Upload IPA
#3
##	Use Spotlight to locate Application Loader, use this program to upload the App.ipa file.
##	
##Checkin Final changes
##
##	git commit -am"ddd"
##	git branch x.x.x
##	

Deploy Android Production Version
=================================

Prepare Certificates Manually
-----------------------------

The Release version of the App has been signed using the following tools.  It could also have been signed by various development environment.

Generate a private key using keytool. This example prompts you for passwords for the keystore and key, and to provide the Distinguished Name fields for your key. It then generates the keystore as a file called your-bible.keystore. The keystore contains a single key, valid for 10000 days. The alias is a name that you will use later when signing your app.

	cd $HOME/ShortSands/BibleApp/YourBible/certificates/android
	keytool -genkey -v -keystore your-bible.keystore -alias YourBible -keyalg RSA -keysize 2048 -validity 10000
	use password: Jabberw0kky
	enter: CN=Gary Griswold, OU=ShortSands, O=ShortSands, L=Cincinnati, ST=OH, C=US
	
Compile and Sign App
--------------------

### NOTE: Jan 4, 2017 platforms/android/gradle.build had to be revised
### lines 203 - 218 were commented out.  This change prevented += 8 being added to the
### android version, which made the version number too small for an upload.
### Also changed line 215 to: defaultConfig.versionCode = defaultConfig.versionCode * 10 + 8

If one needs to find the android version use the following:
	
	cd $HOME/Library/Android/sdk/build-tools/25.0.0
	./aapt dump badging android-release.apk

Update version code in config.xml

	vi $HOME/BibleApp/YourBible/config.xml

Compile your app in release mode to obtain an unsigned APK.

	cd $HOME/ShortSands/BibleApp/YourBible
	./Build_android.sh Release
	cordova build android --release
	output:
	/Users/garygriswold/ShortSands/BibleApp/YourBible/platforms/android/build/outputs/apk/android-release-unsigned.apk
	ls -l /Users/garygriswold/ShortSands/BibleApp/YourBible/platforms/android/build/outputs/apk/android-release-unsigned.apk

Sign your app with your private key using jarsigner. This example prompts you for passwords for the keystore and key. It then modifies the APK in-place to sign it. Note that you can sign an APK multiple times with different keys.

	cd $HOME/ShortSands/BibleApp/YourBible/certificates/android
	rm -i *.apk
	cp $HOME/ShortSands/BibleApp/YourBible/platforms/android/build/outputs/apk/android-release-unsigned.apk .
	jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore your-bible.keystore android-release-unsigned.apk YourBible

Verify that your APK is signed. For example:

	jarsigner -verify -verbose -certs android-release-unsigned.apk
	cp android-release-unsigned.apk android-release-signed.apk	
	
Align the final APK package using zipalign.  zipalign ensures that all uncompressed data starts with a particular byte alignment relative to the start of the file, which reduces the amount of RAM consumed by an app.

	$HOME/Library/Android/sdk/build-tools/25.0.0/zipalign -v 4 android-release-signed.apk android-release.apk
	ls -lt
	
Upload APK




	