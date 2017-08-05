/*

 Copyright (c) 2009 Anant Garg (anantgarg.com | inscripts.com)

 This script may be used for non-commercial purposes only. For any
 commercial purposes, please contact the author at
 anant.garg@inscripts.com

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 OTHER DEALINGS IN THE SOFTWARE.

 */
var $jq = jQuery.noConflict();
var windowFocus = true;
var username;
var chatHeartbeatCount = 0;
var minChatHeartbeat = 1000;
var maxChatHeartbeat = 33000;
var chatHeartbeatTime = minChatHeartbeat;
var originalTitle;
var blinkOrder = 0;

var chatboxFocus = new Array();
var newMessages = new Array();
var newMessagesWin = new Array();
var chatBoxes = new Array();

$jq(document).ready(function () {
    console.log(current_username);
    originalTitle = document.title;
    startChatSession();
    updateLastLogin();
    $jq([window, document]).blur(function () {
        windowFocus = false;
    }).focus(function () {
        windowFocus = true;
        document.title = originalTitle;
    });
});
function updateLastLogin() {
    $jq.post(baseUrl + "chat/index/updatelastlogin", {}, function (data) {
        setTimeout('updateLastLogin();', 10000);
    });
}
function restructureChatBoxes() {
    align = 0;
    if (chatBoxes.length > 0) {
        for (x in chatBoxes) {

            chatboxtitle = chatBoxes[x];

            if ($jq("#chatbox_" + chatboxtitle).css('display') != 'none') {
                if (align == 0) {
                    $jq("#chatbox_" + chatboxtitle).css('right', '20px');
                } else {
                    width = (align) * (225 + 7) + 20;
                    $jq("#chatbox_" + chatboxtitle).css('right', width + 'px');
                }
                align++;
            }
        }
    }
}

function chatWith(chatuser) {
    createChatBox(chatuser);
    $jq("#chatbox_" + chatuser + " .chatboxtextarea").focus();
}

function createChatBox(chatboxtitle, minimizeChatBox) {

    if ($jq("#chatbox_" + chatboxtitle).length > 0) {
        if ($jq("#chatbox_" + chatboxtitle).css('display') == 'none') {
            $jq("#chatbox_" + chatboxtitle).css('display', 'block');

            restructureChatBoxes();

        }

        $jq("#chatbox_" + chatboxtitle + " .chatboxtextarea").focus();
        return;
    }

    $jq(" <div />").attr("id", "chatbox_" + chatboxtitle)
            .addClass("chatbox")
            .html('<div class="chatboxhead"><div class="chatboxtitle"><a href="javascript:void(0)" onclick="javascript:toggleChatBoxGrowth(\'' + chatboxtitle + '\')">' + chatboxtitle + '</a></div><div class="chatboxoptions"><a href="javascript:void(0)" onclick="javascript:toggleChatBoxGrowth(\'' + chatboxtitle + '\')"><i class="fa fa-minus" aria-hidden="true"></i></a> <a href="javascript:void(0)" onclick="javascript:closeChatBox(\'' + chatboxtitle + '\')"><i class="fa fa-times" aria-hidden="true"></i></a></div><br clear="all"/></div><div class="chatboxcontent"></div><div class="chatboxinput"><textarea class="chatboxtextarea" onkeydown="javascript:return checkChatBoxInputKey(event,this,\'' + chatboxtitle + '\');"></textarea></div>')
            .appendTo($jq("body"));

    $jq("#chatbox_" + chatboxtitle).css('bottom', '0px');

    chatBoxeslength = 0;

    if (chatBoxes.length > 0) {
        for (x in chatBoxes) {
            if ($jq("#chatbox_" + chatBoxes[x]).css('display') != 'none') {
                chatBoxeslength++;
            }
        }
    }
    if (chatBoxeslength == 0) {
        $jq("#chatbox_" + chatboxtitle).css('right', '20px');
    } else {
        width = (chatBoxeslength) * (225 + 7) + 20;
        $jq("#chatbox_" + chatboxtitle).css('right', width + 'px');
    }

    chatBoxes.push(chatboxtitle);

    if (minimizeChatBox == 1) {
        minimizedChatBoxes = new Array();

        if ($jq.cookie('chatbox_minimized')) {
            minimizedChatBoxes = $jq.cookie('chatbox_minimized').split(/\|/);
        }
        minimize = 0;
        for (j = 0; j < minimizedChatBoxes.length; j++) {
            if (minimizedChatBoxes[j] == chatboxtitle) {
                minimize = 1;
            }
        }

        if (minimize == 1) {
            $jq('#chatbox_' + chatboxtitle + ' .chatboxcontent').css('display', 'none');
            $jq('#chatbox_' + chatboxtitle + ' .chatboxinput').css('display', 'none');
        }
    }

    chatboxFocus[chatboxtitle] = false;

    $jq("#chatbox_" + chatboxtitle + " .chatboxtextarea").blur(function () {
        chatboxFocus[chatboxtitle] = false;
        $jq("#chatbox_" + chatboxtitle + " .chatboxtextarea").removeClass('chatboxtextareaselected');
    }).focus(function () {
        chatboxFocus[chatboxtitle] = true;
        newMessages[chatboxtitle] = false;
        $jq('#chatbox_' + chatboxtitle + ' .chatboxhead').removeClass('chatboxblink');
        $jq("#chatbox_" + chatboxtitle + " .chatboxtextarea").addClass('chatboxtextareaselected');
    });

    $jq("#chatbox_" + chatboxtitle).click(function () {
        if ($jq('#chatbox_' + chatboxtitle + ' .chatboxcontent').css('display') != 'none') {
            $jq("#chatbox_" + chatboxtitle + " .chatboxtextarea").focus();
        }
    });

    $jq("#chatbox_" + chatboxtitle).show();
}


function chatHeartbeat() {

    var itemsfound = 0;

    if (windowFocus == false) {

        var blinkNumber = 0;
        var titleChanged = 0;
        for (x in newMessagesWin) {
            if (newMessagesWin[x] == true) {
                ++blinkNumber;
                if (blinkNumber >= blinkOrder) {
                    document.title = x + ' says...';
                    titleChanged = 1;
                    break;
                }
            }
        }

        if (titleChanged == 0) {
            document.title = originalTitle;
            blinkOrder = 0;
        } else {
            ++blinkOrder;
        }

    } else {
        for (x in newMessagesWin) {
            newMessagesWin[x] = false;
        }
    }

    for (x in newMessages) {
        if (newMessages[x] == true) {
            if (chatboxFocus[x] == false) {
                //FIXME: add toggle all or none policy, otherwise it looks funny
                $jq('#chatbox_' + x + ' .chatboxhead').toggleClass('chatboxblink');
            }
        }
    }

    $jq.post(baseUrl + "chat/index/chatheartbeat", {}, function (data) {

        $jq.each(data.items, function (i, item) {
            if (item) { // fix strange ie bug

                chatboxtitle = item.f;

                if ($jq("#chatbox_" + chatboxtitle).length <= 0) {

                    createChatBox(chatboxtitle);
                }
                if ($jq("#chatbox_" + chatboxtitle).css('display') == 'none') {
                    $jq("#chatbox_" + chatboxtitle).css('display', 'block');
                    restructureChatBoxes();
                }

                if (item.s == 1) {
                    item.f = username;
                }

                if (item.s == 2) {
                    $jq("#chatbox_" + chatboxtitle + " .chatboxcontent").append('<div class="chatboxmessage"><span class="chatboxinfo">' + item.m + '</span></div>');
                } else {

                    var pos = (item.f == current_username) ? "right" : "";
                    newMessages[chatboxtitle] = true;
                    newMessagesWin[chatboxtitle] = true;
                    $jq("#chatbox_" + chatboxtitle + " .chatboxcontent").append('<div class="chatboxmessage ' + pos + ' clearfix"><div class="chat-user"><img src="https://www.pixelmarket.net/media/wysiwyg/default_chat_avatar.jpg" alt="image" width="50" height="50" /></div><div class="chat-desc"><div class="chatboxmessagefrom">' + item.f + ':&nbsp;&nbsp;</div><div class="chatboxmessagecontent">' + item.m + '<span>' + item.t + '</span></div></div></div>');
//                    $jq("#chatbox_" + chatboxtitle + " .chatboxcontent").append('<div class="chatboxmessage ' + pos + ' clearfix"><div class="chat-user"><img src="https://www.pixelmarket.net/media/wysiwyg/default_chat_avatar.jpg" alt="image" width="50" height="50" /></div><div class="chat-desc"><div class="chatboxmessagefrom">' + item.f + ':&nbsp;&nbsp;</div><div class="chatboxmessagecontent">' + item.m + '<span data-livestamp="' + item.t + '"></span></div></div></div>');
                }

                $jq("#chatbox_" + chatboxtitle + " .chatboxcontent").scrollTop($jq("#chatbox_" + chatboxtitle + " .chatboxcontent")[0].scrollHeight);
                itemsfound += 1;
            }
        });

        chatHeartbeatCount++;

        if (itemsfound > 0) {
            chatHeartbeatTime = minChatHeartbeat;
            chatHeartbeatCount = 1;
        } else if (chatHeartbeatCount >= 10) {
            chatHeartbeatTime *= 2;
            chatHeartbeatCount = 1;
            if (chatHeartbeatTime > maxChatHeartbeat) {
                chatHeartbeatTime = maxChatHeartbeat;
            }
        }
        if (data.flag == true) {
            $jq('.chatboxcontent').mCustomScrollbar("destroy");
            $jq(".chatboxcontent").mCustomScrollbar({
                setHeight: 300
            }).mCustomScrollbar("scrollTo", "bottom", {scrollInertia: 0});
        }
        setTimeout('chatHeartbeat();', chatHeartbeatTime);
    }, 'json');
}

function closeChatBox(chatboxtitle) {
    $jq('#chatbox_' + chatboxtitle).css('display', 'none');
    restructureChatBoxes();

    $jq.post(baseUrl + "chat/index/closechat", {chatbox: chatboxtitle}, function (data) {
    });

}

function showChatHistoryof(username) {
    $jq.post(baseUrl + "chat/index/chathistoryof", {username: username}, function (data) {
        if (data.flag == true) {
            $jq('.cht-lg').mCustomScrollbar("destroy");
            $jq('ul.cht-lg-list').html('');
            $jq('ul.cht-lg-list').html(data.html);
            $jq('span.chat-with-name').text(username);
            $jq(".cht-lg").mCustomScrollbar({
                setHeight: 625
            });
            $jq(".cht-lg").mCustomScrollbar("scrollTo", "bottom", {scrollInertia: 0});

            $jq('#list_send_msg').val(username);
        }
    }, 'json');
}

function chatListHeartbeat(username) {
    $jq.post(baseUrl + "chat/index/chathistoryheartbeat", {username: username}, function (data) {
        if (data.flag == true) {
            $jq('.cht-lg').mCustomScrollbar("destroy");
            $jq(".cht-lg-list").append(data.html);
            $jq('.chat-time').livestamp();
            $jq(".cht-lg").mCustomScrollbar({
                setHeight: 625
            });
            $jq(".cht-lg").mCustomScrollbar("scrollTo", "bottom", {scrollInertia: 0});
        }
        setTimeout('chatListHeartbeat(username);', chatHeartbeatTime);
    }, 'json');
}

function toggleChatBoxGrowth(chatboxtitle) {
    if ($jq('#chatbox_' + chatboxtitle + ' .chatboxcontent').css('display') == 'none') {

        var minimizedChatBoxes = new Array();

        if ($jq.cookie('chatbox_minimized')) {
            minimizedChatBoxes = $jq.cookie('chatbox_minimized').split(/\|/);
        }

        var newCookie = '';

        for (i = 0; i < minimizedChatBoxes.length; i++) {
            if (minimizedChatBoxes[i] != chatboxtitle) {
                newCookie += chatboxtitle + '|';
            }
        }

        newCookie = newCookie.slice(0, -1)


        $jq.cookie('chatbox_minimized', newCookie);
        $jq('#chatbox_' + chatboxtitle + ' .chatboxcontent').css('display', 'block');
        $jq('#chatbox_' + chatboxtitle + ' .chatboxinput').css('display', 'block');
        $jq("#chatbox_" + chatboxtitle + " .chatboxcontent").scrollTop($jq("#chatbox_" + chatboxtitle + " .chatboxcontent")[0].scrollHeight);
    } else {

        var newCookie = chatboxtitle;

        if ($jq.cookie('chatbox_minimized')) {
            newCookie += '|' + $jq.cookie('chatbox_minimized');
        }


        $jq.cookie('chatbox_minimized', newCookie);
        $jq('#chatbox_' + chatboxtitle + ' .chatboxcontent').css('display', 'none');
        $jq('#chatbox_' + chatboxtitle + ' .chatboxinput').css('display', 'none');
    }

}

function checkChatBoxInputKey(event, chatboxtextarea, chatboxtitle) {

    if (event.keyCode == 13 && event.shiftKey == 0) {
        message = $jq(chatboxtextarea).val();
        message = message.replace(/^\s+|\s+$jq/g, "");

        $jq(chatboxtextarea).val('');
        $jq(chatboxtextarea).focus();
        $jq(chatboxtextarea).css('height', '44px');
        if (message != '') {
            $jq.post(baseUrl + "chat/index/sendchat", {to: chatboxtitle, message: message}, function (data) {
                message = message.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");
                var pos = (username == current_username) ? "right" : "";
                $jq('.chatboxcontent').mCustomScrollbar("destroy");
                $jq("#chatbox_" + chatboxtitle + " .chatboxcontent").append('<div class="chatboxmessage ' + pos + ' clearfix"><div class="chat-user"><img src="https://www.pixelmarket.net/media/wysiwyg/default_chat_avatar.jpg" alt="image" width="50" height="50" /></div><div class="chat-desc"><div class="chatboxmessagefrom">' + username + ':&nbsp;&nbsp;</div><div class="chatboxmessagecontent">' + message + '<span class="msg-time"></span></div></div></div>');
                $jq('.msg-time').livestamp();
                $jq("#chatbox_" + chatboxtitle + " .chatboxcontent").scrollTop($jq("#chatbox_" + chatboxtitle + " .chatboxcontent")[0].scrollHeight);
                $jq(".chatboxcontent").mCustomScrollbar({
                    setHeight: 300
                }).mCustomScrollbar("scrollTo", "bottom", {scrollInertia: 0});
            });


        }
        chatHeartbeatTime = minChatHeartbeat;
        chatHeartbeatCount = 1;

        return false;
    }

    var adjustedHeight = chatboxtextarea.clientHeight;
    var maxHeight = 94;

    if (maxHeight > adjustedHeight) {
        adjustedHeight = Math.max(chatboxtextarea.scrollHeight, adjustedHeight);
        if (maxHeight)
            adjustedHeight = Math.min(maxHeight, adjustedHeight);
        if (adjustedHeight > chatboxtextarea.clientHeight)
            $jq(chatboxtextarea).css('height', adjustedHeight + 8 + 'px');
    } else {
        $jq(chatboxtextarea).css('overflow', 'auto');
    }

}

function checkListChatBoxInputKey(event, chatboxtextarea) {

    if (event.keyCode == 13 && event.shiftKey == 0) {
        message = $jq(chatboxtextarea).val();
        message = message.replace(/^\s+|\s+$jq/g, "");
        var chatboxtitle = $jq('#list_send_msg').val();
        $jq(chatboxtextarea).val('');
        $jq(chatboxtextarea).focus();
        $jq(chatboxtextarea).css('height', '44px');
        if (message != '') {
            $jq.post(baseUrl + "chat/index/sendchat", {to: chatboxtitle, message: message}, function (data) {
                message = message.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");
                var pos = (username == current_username) ? "right" : "";
                $jq('.cht-lg').mCustomScrollbar("destroy");
                $jq(".cht-lg-list").append('<li class="' + pos + ' letest' + username + '"><div class="chat-cont clearfix"><div class="chat-user"><img src="https://www.pixelmarket.net/media/wysiwyg/default_chat_avatar.jpg" alt="image" width="50" height="50" /></div><div class="chat-desc"><p>' + message + '</p><div class="msg-time"></div></div></div></li>');
                $jq('.msg-time').livestamp();
                $jq(".cht-lg").mCustomScrollbar({
                    setHeight: 625
                });
                $jq(".cht-lg").mCustomScrollbar("scrollTo", "bottom", {scrollInertia: 0});
            });

        }
        return false;
    }

}

function startChatSession() {
    $jq.post(baseUrl + "chat/index/startchatsession", {}, function (data) {
        username = data.username;


        $jq.each(data.items, function (i, item) {

            if (item) { // fix strange ie bug
                chatboxtitle = item.f;

                if ($jq("#chatbox_" + chatboxtitle).length <= 0) {

                    createChatBox(chatboxtitle, 1);

                }

                if (item.s == 1) {
                    item.f = username;
                }

                if (item.s == 2) {
                    $jq("#chatbox_" + chatboxtitle + " .chatboxcontent").append('<div class="chatboxmessage"><span class="chatboxinfo">' + item.m + '</span></div>');
                } else {
                    var pos = (item.f == current_username) ? "right" : "";
                   $jq("#chatbox_" + chatboxtitle + " .chatboxcontent").append('<div class="chatboxmessage ' + pos + ' clearfix"><div class="chat-user"><img src="https://www.pixelmarket.net/media/wysiwyg/default_chat_avatar.jpg" alt="image" width="50" height="50" /></div><div class="chat-desc"><div class="chatboxmessagefrom">' + item.f + ':&nbsp;&nbsp;</div><div class="chatboxmessagecontent">' + item.m + '<span>' + item.t + '</span></div></div></div>');
//                    $jq("#chatbox_" + chatboxtitle + " .chatboxcontent").append('<div class="chatboxmessage ' + pos + ' clearfix"><div class="chat-user"><img src="https://www.pixelmarket.net/media/wysiwyg/default_chat_avatar.jpg" alt="image" width="50" height="50" /></div><div class="chat-desc"><div class="chatboxmessagefrom">' + item.f + ':&nbsp;&nbsp;</div><div class="chatboxmessagecontent">' + item.m + '<span data-livestamp="' + item.t + '"></span></div></div></div>');

                }
            }
        });

        for (i = 0; i < chatBoxes.length; i++) {
            chatboxtitle = chatBoxes[i];
            $jq("#chatbox_" + chatboxtitle + " .chatboxcontent").scrollTop($jq("#chatbox_" + chatboxtitle + " .chatboxcontent")[0].scrollHeight);
            setTimeout('$jq("#chatbox_"+chatboxtitle+" .chatboxcontent").scrollTop($jq("#chatbox_"+chatboxtitle+" .chatboxcontent")[0].scrollHeight);', 100); // yet another strange ie bug
        }

//        $jq('.chatboxcontent').mCustomScrollbar("destroy");
        $jq(".chatboxcontent").mCustomScrollbar({
            setHeight: 300
        }).mCustomScrollbar("scrollTo", "bottom", {scrollInertia: 0});

        setTimeout('chatHeartbeat();', chatHeartbeatTime);
        setTimeout('chatListHeartbeat(username);', chatHeartbeatTime);
    }, 'json');
}

/**
 * Cookie plugin
 *
 * Copyright (c) 2006 Klaus Hartl (stilbuero.de)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 */

jQuery.cookie = function (name, value, options) {
    if (typeof value != 'undefined') { // name and value given, set cookie
        options = options || {};
        if (value === null) {
            value = '';
            options.expires = -1;
        }
        var expires = '';
        if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
            var date;
            if (typeof options.expires == 'number') {
                date = new Date();
                date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
            } else {
                date = options.expires;
            }
            expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE
        }
        // CAUTION: Needed to parenthesize options.path and options.domain
        // in the following expressions, otherwise they evaluate to undefined
        // in the packed version for some reason...
        var path = options.path ? '; path=' + (options.path) : '';
        var domain = options.domain ? '; domain=' + (options.domain) : '';
        var secure = options.secure ? '; secure' : '';
        document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
    } else { // only name given, get cookie
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
};

jQuery.noConflict();
