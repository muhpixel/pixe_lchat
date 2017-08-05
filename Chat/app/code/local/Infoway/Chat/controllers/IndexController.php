<?php

class Infoway_Chat_IndexController extends Mage_Core_Controller_Front_Action {

    public function IndexAction() {

        $this->loadLayout();
        $this->getLayout()->getBlock("head")->setTitle($this->__("Inbox"));
        /* $breadcrumbs = $this->getLayout()->getBlock("breadcrumbs");
          $breadcrumbs->addCrumb("home", array(
          "label" => $this->__("Home Page"),
          "title" => $this->__("Home Page"),
          "link"  => Mage::getBaseUrl()
          ));

          $breadcrumbs->addCrumb("inbox", array(
          "label" => $this->__("Inbox"),
          "title" => $this->__("Inbox")
          )); */

        $this->renderLayout();
    }

    public function StartChatSessionAction() {
        session_start();
        $respData = array('username' => '', 'items' => array());
        $items = array();

        if (!empty($_SESSION['openChatBoxes'])) {
            foreach ($_SESSION['openChatBoxes'] as $chatbox => $void) {
                if (isset($_SESSION['chatHistory'][$chatbox])) {
                    $items = $_SESSION['chatHistory'][$chatbox];
                }
            }
        }

        /* if ($items != '') {
          $items = substr($items, 0, -1);
          } */
        if($_SESSION['username']){
        $respData = array('username' => $_SESSION['username'], 'items' => $items);
        }
        echo $json = Mage::helper('core')->jsonEncode($respData);
        return;
    }

    public function ChatHeartbeatAction() {
        session_start();
        $respData = array('items' => array(), 'flag' => FALSE);
        $resource = Mage::getSingleton('core/resource');
        $readConnection = $resource->getConnection('core_read');
        //$currVisitorInfo = @file_get_contents('http://ip-api.com/json/' . $_SERVER['REMOTE_ADDR']);
       // $currVisitorInfoObject = json_decode($currVisitorInfo);
//        $currVisitorTimezone = $currVisitorInfoObject->timezone;
        //$storeTimeZone = Mage::getStoreConfig('general/locale/timezone');
        $storeTimeZone = 'UTC';
        /* Get the table name */
        $tableName = $resource->getTableName('chat');
        $query = array();
        if(isset($_SESSION['username'])):
        $sql = "select * from $tableName where (chat.to = '" . $_SESSION['username'] . "' AND recd = 0) order by id ASC";

        $query = $readConnection->fetchAll($sql);
        endif;
        $items = array();

        $chatBoxes = array();
        if (is_array($query) && count($query) > 0) {


            foreach ($query as $chat) {
                if (!isset($_SESSION['openChatBoxes'][$chat['from']]) && isset($_SESSION['chatHistory'][$chat['from']])) {
                    $items = $_SESSION['chatHistory'][$chat['from']];
                }

                $text = htmlspecialchars($chat['message'], ENT_QUOTES);
                $text = str_replace("\n\r", "\n", $text);
                $text = str_replace("\r\n", "\n", $text);
                $chat['message'] = str_replace("\n", "<br>", $text);


                $date = new DateTime($chat['sent'], new DateTimeZone($storeTimeZone));
                $date->setTimezone(new DateTimeZone("UTC")); //$currVisitorTimezone
                $chatSent = $date->format('Y-m-d H:i:s');

                $items[] = array(
                    "s" => "0",
                    "f" => $chat['from'],
                    "m" => $chat['message'],
                    "t" => $chatSent
                );

                if (!isset($_SESSION['chatHistory'][$chat['from']])) {
                    $_SESSION['chatHistory'][$chat['from']] = '';
                }

                $_SESSION['chatHistory'][$chat['from']][] = array(
                    "s" => "0",
                    "f" => $chat['from'],
                    "m" => $chat['message'],
                    "t" => $chatSent
                );

                unset($_SESSION['tsChatBoxes'][$chat['from']]);
                $_SESSION['openChatBoxes'][$chat['from']] = $chatSent;
            }
            $respData['flag'] = TRUE;
        }

        if (!empty($_SESSION['openChatBoxes'])) {
            foreach ($_SESSION['openChatBoxes'] as $chatbox => $time) {
                if (!isset($_SESSION['tsChatBoxes'][$chatbox])) {
                    $date = new DateTime($time, new DateTimeZone($storeTimeZone));
                    $date->setTimezone(new DateTimeZone("UTC")); //$currVisitorTimezone
                    $time = $date->format('Y-m-d H:i:s');

                    $now = time() - strtotime($time);
                    $time = date('g:iA M dS', strtotime($time));

                    $message = "Sent at $time";
                    if ($now > 180) {
                        $items[] = array(
                            "s" => "2",
                            "f" => $chatbox,
                            "m" => $message,
                            "t" => $time
                        );

                        if (!isset($_SESSION['chatHistory'][$chatbox])) {
                            $_SESSION['chatHistory'][$chatbox] = '';
                        }

                        $_SESSION['chatHistory'][$chatbox][] = array(
                            "s" => "2",
                            "f" => $chatbox,
                            "m" => $message,
                            "t" => $time
                        );

                        $_SESSION['tsChatBoxes'][$chatbox] = 1;
                    }
                }
            }
        }
        if(isset($_SESSION['username'])):
        $sql = "update $tableName set recd = 1 where chat.to = '" . $_SESSION['username'] . "' and recd = 0";
        $query = $readConnection->query($sql);
        endif;
        $respData['items'] = $items;
        echo $json = Mage::helper('core')->jsonEncode($respData);
        return;
    }

    public function SendChatAction() {
        session_start();

        $from = $_SESSION['username'];
        $to = $_POST['to'];
        $message = str_replace("'", "", $_POST['message']);

        $resource = Mage::getSingleton('core/resource');
        $readConnection = $resource->getConnection('core_read');
        $tableName = $resource->getTableName('chat');

        $_SESSION['openChatBoxes'][$_POST['to']] = date('Y-m-d H:i:s', time());
        $text = htmlspecialchars($message, ENT_QUOTES);
        $text = str_replace("\n\r", "\n", $text);
        $text = str_replace("\r\n", "\n", $text);
        $messagesan = str_replace("\n", "<br>", $text);

        if (!isset($_SESSION['chatHistory'][$_POST['to']])) {
            $_SESSION['chatHistory'][$_POST['to']] = '';
        }

        $currVisitorInfo = file_get_contents('http://ip-api.com/json/' . $_SERVER['REMOTE_ADDR']);
        $currVisitorInfoObject = json_decode($currVisitorInfo);
        $currVisitorTimezone = $currVisitorInfoObject->timezone;
        //$storeTimeZone = Mage::getStoreConfig('general/locale/timezone');
        $storeTimeZone = 'UTC';
        $timeNow = date('Y-m-d H:i:s');
        $date = new DateTime($timeNow, new DateTimeZone($storeTimeZone));
        $date->setTimezone(new DateTimeZone("UTC")); //$currVisitorTimezone
        $now = $date->format('Y-m-d H:i:s');
        $_SESSION['chatHistory'][$_POST['to']][] = array(
            "s" => "1",
            "f" => $to,
            "m" => $messagesan,
            "t" => $now
        );
        unset($_SESSION['tsChatBoxes'][$_POST['to']]);

        $sql = "insert into $tableName (chat.from,chat.to,message,sent) values ('" . $from . "', '" . $to . "','" . $message . "','" . $timeNow . "')";
        $query = $readConnection->query($sql);

        echo "1";
        exit(0);
    }

    public function CloseChatAction() {
        unset($_SESSION['openChatBoxes'][$_POST['chatbox']]);

        echo "1";
        exit(0);
    }

    public function chathistoryofAction() {
        session_start();
        $respData = array('flag' => FALSE, 'html' => '');
        $data = $this->getRequest()->getPost();
        $html = '';
        $dateWiseChat = array();
        $currVisitorInfo = file_get_contents('http://ip-api.com/json/' . $_SERVER['REMOTE_ADDR']);
        $currVisitorInfoObject = json_decode($currVisitorInfo);
        $currVisitorTimezone = $currVisitorInfoObject->timezone;
        //$storeTimeZone = Mage::getStoreConfig('general/locale/timezone');
        $storeTimeZone = 'UTC';

        if (Mage::getSingleton('customer/session')->isLoggedIn()) {
            $currUserData = Mage::getSingleton('customer/session')->getCustomer();
            $curr_user_id = $currUserData->getId();
            $resource = Mage::getSingleton('core/resource');
            $readConnection = $resource->getConnection('core_read');
            $tableName = $resource->getTableName('chat');
            $results = array();
            if(isset($_SESSION['username'])):
            $sql = "SELECT *,DATE(`sent`) as d FROM $tableName WHERE `from` IN ('" . $_SESSION['username'] . "',  '" . $data['username'] . "')AND  `to` IN ('" . $_SESSION['username'] . "',  '" . $data['username'] . "') ORDER BY id ASC";
            $results = $readConnection->fetchAll($sql);
        endif;
            if (is_array($results) && count($results) > 0) {
                foreach ($results as $result) {
                    $date = new DateTime($result['d'], new DateTimeZone($storeTimeZone));
                    $date->setTimezone(new DateTimeZone("UTC")); //$currVisitorTimezone
                    $day = $date->format('Y-m-d');
                    $dateWiseChat[$day][] = $result;
                }

                if (is_array($dateWiseChat) && count($dateWiseChat) > 0) {
                    foreach ($dateWiseChat as $key => $date) {

                        $html .='<li>
                    <div class="chat-date"><span>' . $key . '</span></div>
                </li>';
                        foreach ($date as $chat) {
                            $date = new DateTime($chat['sent'], new DateTimeZone($storeTimeZone));
                            $date->setTimezone(new DateTimeZone("UTC")); //$currVisitorTimezone
                            $tme = $date->format('Y-m-d H:i:s');
                            $right = ($chat['from'] == $_SESSION['username']) ? ' class="right"' : '';
                            $html .= '<li ' . $right . '>
                    <div class="chat-cont clearfix">
                        <div class="chat-user">
                            <img src="https://www.pixelmarket.net/media/wysiwyg/default_chat_avatar.jpg" alt="image" width="50" height="50" />
                        </div>
                        <div class="chat-desc">
                            <p>' . $chat['message'] . '</p>
                            <div class="chat-time">' . $tme . '</div>
                        </div>
                    </div>
                </li>';
                        }
                    }
                }
            }

            $respData['flag'] = TRUE;
            $respData['html'] = $html;

            //Json Encode an Array in Magento
            echo $json = Mage::helper('core')->jsonEncode($respData);
        }
        return;
    }

    public function chatHistoryHeartbeatAction() {
        session_start();
        $respData = array('flag' => FALSE, 'html' => '');
        $data = $this->getRequest()->getPost();
        $html = '';
        /*$currVisitorInfo = file_get_contents('http://ip-api.com/json/' . $_SERVER['REMOTE_ADDR']);
        $currVisitorInfoObject = json_decode($currVisitorInfo);
        $currVisitorTimezone = $currVisitorInfoObject->timezone;*/
        //$storeTimeZone = Mage::getStoreConfig('general/locale/timezone');
        $storeTimeZone = 'UTC';
        if (Mage::getSingleton('customer/session')->isLoggedIn()) {

            $resource = Mage::getSingleton('core/resource');
            $readConnection = $resource->getConnection('core_read');
            $tableName = $resource->getTableName('chat');
            $results = array();
            if(isset($_SESSION['username'])):
            $sql = "SELECT * FROM $tableName WHERE `from` = '" . $data['username'] . "' AND  `to` ='" . $_SESSION['username'] . "' AND recd = 0 ORDER BY id ASC";

            $results = $readConnection->fetchAll($sql);
endif;
            if (is_array($results) && count($results) > 0) {

                foreach ($results as $chat) {
                    $date = new DateTime($chat['sent'], new DateTimeZone($storeTimeZone));
                    $date->setTimezone(new DateTimeZone("UTC")); //$currVisitorTimezone
                    $tme = $date->format('Y-m-d H:i:s');
                    $html .= '<li class="right">
                    <div class="chat-cont clearfix">
                        <div class="chat-user">
                            <img src="https://www.pixelmarket.net/media/wysiwyg/default_chat_avatar.jpg" alt="image" width="50" height="50" />
                        </div>
                        <div class="chat-desc">
                            <p>' . $chat['message'] . '</p>
                            <div class="chat-time">' . $tme . '</div>
                        </div>
                    </div>
                </li>';
                }
                $respData['flag'] = TRUE;
                $respData['html'] = $html;
            }

            //Json Encode an Array in Magento
            echo $json = Mage::helper('core')->jsonEncode($respData);
        }

        return;
    }

    public function updateLastLoginAction() {
        session_start();
        if (Mage::getSingleton('customer/session')->isLoggedIn()) {
            $resource = Mage::getSingleton('core/resource');
            $readConnection = $resource->getConnection('core_read');
            $tableName = $resource->getTableName('chat_customer_log');
            $id = null;
            if(isset($_SESSION['username'])):
            $sql = "SELECT `id` FROM $tableName WHERE `customer` ='" . $_SESSION['username'] . "'";
            $timeNow = strtotime(date('Y-m-d H:i:s'));
            $id = $readConnection->fetchOne($sql);
            endif;

            if ($id) {
                $sql = "update $tableName set last_login = '" . $timeNow . "' where `id` = $id";
                $query = $readConnection->query($sql);
            } else {
                if(isset($_SESSION['username'])):
                $sql = "insert into $tableName (customer,last_login) values ('" . $_SESSION['username'] . "', '" . $timeNow . "')";
                $query = $readConnection->query($sql);
                endif;
            }
        }

        return;
    }

}
