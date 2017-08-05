<?php
/**
* Observer for Set/unset SESSION
* @author Infoway Magento Team
*/
	class Infoway_Chat_Model_Observer {
            
            public function login(){
                if (Mage::getSingleton('customer/session')->isLoggedIn()) {
                    $customerData = Mage::getSingleton('customer/session')->getCustomer();
                    $username = $customerData->getUsername();
                    $_SESSION['username'] = $username;
                }
            }
            
            public function logout(){
                session_destroy();
            }
	}