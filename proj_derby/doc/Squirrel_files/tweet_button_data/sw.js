function swOnLoad() {
	if (document.getElementById('progresspage') != null) {
		resizeWindow();
		if (document.getElementById('progresspagedone') == null) {
			makeRequest();
		}
	}
}

function swOnClick() {
	if (document.getElementById('continuesession') != null) {
		resizeWindow();
		if (document.getElementById('progresspagedone') == null) {
			makeRequest();
		}
	}
}

function writeToDocument (stringToWrite) {
	if (stringToWrite != '') {
		document.write(stringToWrite);
	}
}

function computeLastQuotaURL (url, urlprefix) {
	if (url.indexOf(urlprefix) >= 0) {
		var pos = url.indexOf("url=") + 4;
		url = url.substring(pos);
		url = decodeURIComponent(url);
	}
	break_line(url);
}

function  utf8Encode(string) {
		string = string.replace(/\r\n/g,"\n");
		var utftext = "";
 
		for (var n = 0; n < string.length; n++) {
 
			var c = string.charCodeAt(n);
 
			if (c < 128) {
				utftext += String.fromCharCode(c);
			}
			else if((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			}
			else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}
 
		}
 
		return utftext;
	}


function encodeUTF8Base64 (inputStr) {
	var charsForEncoding = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
	var encodedString = '';
	var byte1, byte2, byte3;
	var encByte1, encByte2, encByte3, encByte4;
	var i = 0;
	
	inputStr = utf8Encode(inputStr);


	do {
		byte1 = inputStr.charCodeAt(i);
		++i;
		byte2 = inputStr.charCodeAt(i);
		++i;
		byte3 = inputStr.charCodeAt(i);
		++i;
		
		encByte1 = byte1 >> 2;
		encByte2 = ((byte1 & 3) << 4) | (byte2 >> 4);
		encByte3 = ((byte2 & 15) << 2) | (byte3 >> 6);
		encByte4 = byte3 & 63;
		
		if (isNaN(byte3)) {
			encByte4 = 64;
			if (isNaN(byte2)) {
				encByte3 = 64;
			}
		}
		encodedString += charsForEncoding.charAt(encByte1) + charsForEncoding.charAt(encByte2) + charsForEncoding.charAt(encByte3) + charsForEncoding.charAt(encByte4);
	} while (i < inputStr.length);
	return encodedString;
}

var pluginRequest;

function getRequestObject()
{
	var pluginRequest;
	if (typeof XMLHttpRequest != 'undefined') {
		pluginRequest = new XMLHttpRequest();
	}
	if (!pluginRequest) {
		try {
			pluginRequest = new ActiveXObject("Msxml2.XMLHTTP");
		} catch(e) {
			try {
				pluginRequest = new ActiveXObject("Microsoft.XMLHTTP");
			} catch(e) {
				pluginRequest = null;
			}
		}
	}

	return (pluginRequest);
};

function activateSession(url,user,oldurl) {
	var userNameAO = document.getElementById('username');
	var pwAO = document.getElementById('password');
	var slAO = document.getElementById('sessionlength');
	var activateButton = document.getElementById('activatebutton');
	var hasLoginAndPW = false;
	activateButton.disabled = true;
	if ( (userNameAO != null) && (pwAO != null) && (slAO != null) ) {
		if ( (userNameAO.value == "") || (pwAO.value == "") || (slAO.value == "")) {
			alert ("Please insert your login, password and session length!");
			activateButton.disabled = false;
			return;
		}
		hasLoginAndPW = true;
	}
	if (typeof XMLHttpRequest != 'undefined') {
		pluginRequest = new XMLHttpRequest();
	}
	if (!pluginRequest) {
		try {
			pluginRequest = new ActiveXObject("Msxml2.XMLHTTP");
		} catch(e) {
			try {
				pluginRequest = new ActiveXObject("Microsoft.XMLHTTP");
			} catch(e) {
				pluginRequest = null;
			}
		}
	}
	
	//encode data and set header 'Quota-Data'
	var quotaDataStr = "";
	if (user != "" ) {
		var pos = user.indexOf("&apos;");
		while (pos >= 0) {
			user = user.replace(/&apos;/g, "'");
			pos = user.indexOf("&apos;");
		}
		quotaDataStr = encodeUTF8Base64(user);
	}
	if (hasLoginAndPW) {
		quotaDataStr = quotaDataStr + "+1AB2+" + encodeUTF8Base64(userNameAO.value) + "+2CD3+" + encodeUTF8Base64(pwAO.value) + "+3EF4+" + encodeUTF8Base64(slAO.value);
	}
	if (quotaDataStr != "")
		quotaDataStr = encodeUTF8Base64( quotaDataStr );
	
	if (pluginRequest) {
		pluginRequest.open("POST", url, true);
		
		pluginRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		pluginRequest.setRequestHeader("Content-length", 0);
		pluginRequest.setRequestHeader("Quota-Data", quotaDataStr);
		pluginRequest.setRequestHeader("Quota-URL", oldurl);
		pluginRequest.onreadystatechange = function () {
			if (pluginRequest.readyState == 4) {
				var paramIndex = location.pathname.indexOf("/IfpRedirect");				
				if (pluginRequest.status == 403 || paramIndex >= 0) {	
					if(pluginRequest.status == 403)
						document.getElementsByTagName("body")[0].innerHTML = pluginRequest.responseText;
					if(paramIndex >= 0) {
				 		myurl =  pluginRequest.getResponseHeader("Quota-RedirectURL");
       	         		location.replace(myurl);
					}
				} else {
					location.reload(true);
				}
			} else {
				setTimeout(abortPluginRequest, 4000);
			}
    		};
		pluginRequest.send('');
	}
	activateButton.disabled = false;
}

function activateSessionWithSSL(enduserurl,user,oldurl) {
	var userNameAO = document.getElementById('username');
	var pwAO = document.getElementById('password');
	var slAO = document.getElementById('sessionlength');
	var activateButton = document.getElementById('activatebutton');
	var hasLoginAndPW = false;
	activateButton.disabled = true;
	if ( (userNameAO != null) && (pwAO != null) && (slAO != null) ) {
		if ( (userNameAO.value == "") || (pwAO.value == "") || (slAO.value == "")) {
			alert ("Please insert your login, password and session length!");
			activateButton.disabled = false;
			return;
		}
		hasLoginAndPW = true;
	}
	//encode data and set header 'Quota-Data'
	var quotaDataStr = "";
	if (user != "" ) {
		var pos = user.indexOf("&apos;");
		while (pos >= 0) {
			user = user.replace(/&apos;/g, "'");
			pos = user.indexOf("&apos;");
		}
		quotaDataStr = encodeUTF8Base64(user);
	}
	if (hasLoginAndPW) {
		quotaDataStr = quotaDataStr + "+1AB2+" + encodeUTF8Base64(userNameAO.value) + "+2CD3+" + encodeUTF8Base64(pwAO.value) + "+3EF4+" + encodeUTF8Base64(slAO.value);
	}
	if (quotaDataStr != "")
		quotaDataStr = encodeUTF8Base64( quotaDataStr );
		
	var u = "https://www.authserver.xxx" + enduserurl + "&Quota-Data=" + quotaDataStr + "&Quota-URL=" + oldurl;

	location.href=u;
	
	activateButton.disabled = false;
}

function requestOTP()
{
	document.getElementById ("getOTP").disabled = true;
	pluginRequest = getRequestObject();
	pluginRequest.open ("GET", decodeURIComponent (location.href), true);
	pluginRequest.setRequestHeader ("RequestOTP", "yes");
	pluginRequest.onreadystatechange = function () {
		if (pluginRequest.readyState == 4) {
			document.getElementById ("getOTP").disabled = false;
			var context = pluginRequest.getResponseHeader ("OTPContext");
			if (context) {	
				document.getElementById ("password").disabled = false;
				document.getElementById ("activatebutton").disabled = false;
				document.getElementById ("username").value = context;
			} else { 	
				document.getElementsByTagName("body")[0].innerHTML = pluginRequest.responseText;
			}
		} else {
			setTimeout (abortPluginRequest, 10000);
		}
    };
	pluginRequest.send('');
};

function abortPluginRequest (url, withNewRequest) {
	if (! pluginRequest) {
		alert ("No plugin request");
		return;
	}
        if (pluginRequest.readyState != 4) {
		pluginRequest.abort();
	}
}

function break_line(lineToBreak) {
	if (lineToBreak != '') {
		var len = lineToBreak.length;
		var splitStr = '<wbr />';
		for (var i = 0; i < len;) {
			lineToBreak = lineToBreak.substring(0,i) + splitStr + lineToBreak.substring(i);
			i += 20 + splitStr.length;
			len += splitStr.length;
		}
		document.write(lineToBreak);
	}
}

function resizeWindow() {
	var x,y;
	if (self.innerHeight) { // all except Explorer
		x = self.innerWidth;
		y = self.innerHeight;
	} else if (document.documentElement && document.documentElement.clientHeight) {
		// Explorer 6 Strict Mode
		x = document.documentElement.clientWidth;
		y = document.documentElement.clientHeight;
	} else if (document.body) {
		// other Explorers
		x = document.body.clientWidth;
		y = document.body.clientHeight;
	}
	if (x < 700 || y < 500) {
		window.resizeTo (700,500);
	}
}

var httpRequest;
var firstRun = 1;

function makeRequest() {
	if (typeof XMLHttpRequest != 'undefined') {
		window.httpRequest = new XMLHttpRequest();
	}
	if (!window.httpRequest) {
		try {
			window.httpRequest  = new ActiveXObject("Msxml2.XMLHTTP");
		} catch(e) {
			try {
				window.httpRequest  = new ActiveXObject("Microsoft.XMLHTTP");
			} catch(e) {
				window.httpRequest  = null;
			}
		}
	}
	if (window.httpRequest) {
		var old = document.location + "";
		if (old.indexOf ("?")) {
			old = old.substr (0, old.indexOf ("?"));
		}
		window.httpRequest.open("GET", old + "?id=" + document.getElementById("progresspageid").content + "&a=1&" + (new Date()).getTime(), true);
		window.httpRequest.onreadystatechange = getResponse; // Callback Function
		window.httpRequest.send('');
	}
}

var progressBarCount = 20;
var progressBarImageWidth = 15;
var progressBarImageHeight = 20;
var progressBarImageBlue = new Image();
var progressBarImageGrey = new Image();

function getResponse()
{
	if (window.httpRequest.readyState == 4 && window.httpRequest.status == 200) {
		var res = window.httpRequest.responseText.split(";");
		if (res[3] == 1 || res[3] == undefined) { window.location.reload();}
		var text = "";
		if( res[4] == 0) {
			var temp = document.getElementById ('downloadText');
			if (temp) {
				text = temp.content;
				text = text.replace (/[|]a/g, res[0]);
				text = text.replace (/[|]b/g, res[1]);
			} else {
				text = "Downloaded " + res[0] + " of " + res[1];
			}
		} else {
			var temp = document.getElementById ('scanningText');
			if (temp) {
				text = temp.content;
				text = text.replace (/[|]a/g,res[4]);
			} else {
				text = "Scanning in progress (" + res[4] + "s)";
			}
		}
		document.getElementById ("progress").firstChild.nodeValue = text;

		for (i=0; i<progressBarCount; i++) {
			var img = document.getElementById (("i" + i));
			if (img != null) {
				if ((res[4] == 0 && res[2] >= (i * 100 / progressBarCount))
					|| (res[4] > 0 && i == Math.round(res[4]/3) % progressBarCount) )
					img.src = window.progressBarImageBlue.src;
				else
					img.src = window.progressBarImageGrey.src;
				img.width = window.progressBarImageWidth;
				img.height = window.progressBarImageHeight;
			}
		}
		var timeElem = document.getElementById ("time");
		if (timeElem) {
			var now = new Date();
			timeElem.firstChild.nodeValue = now;
		}
		if (window.firstRun == 1 ) { window.setInterval("makeRequest()", 3000); window.firstRun = 0;}
	}
}

function printProgressBar(imgCount,imgDone,img,width,height)
{
	window.progressBarCount = imgCount;
	window.progressBarImageWidth = width;
	window.progressBarImageHeight = height;
	window.progressBarImageBlue.src = imgDone;
	window.progressBarImageGrey.src = img;
	
	for (i=0; i<imgCount; i++) {
		document.write ('<img id ="i' + i + '" src="' + img + '" height="' + height + '" width="' + width + '">\n');
	}		
}
