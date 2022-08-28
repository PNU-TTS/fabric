#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#

# This is a collection of bash functions used by different scripts

ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/pnu.com/orderers/orderer.pnu.com/msp/tlscacerts/tlsca.pnu.com-cert.pem
PEER0_MANAGEMENT_PEER_ORG_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/management-peer-org.pnu.com/peers/peer0.management-peer-org.pnu.com/tls/ca.crt
PEER0_REC_CLIENT_PEER_ORG_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/rec-client-peer-org.pnu.com/peers/peer0.rec-client-peer-org.pnu.com/tls/ca.crt
PEER0_ORG3_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt

# Set OrdererOrg.Admin globals
setOrdererGlobals() {
  CORE_PEER_LOCALMSPID="OrdererMSP"
  CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/pnu.com/orderers/orderer.pnu.com/msp/tlscacerts/tlsca.pnu.com-cert.pem
  CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/ordererOrganizations/pnu.com/users/Admin@pnu.com/msp
}

# Set environment variables for the peer org
setGlobals() {
  ORG=$1
  if [ $ORG -eq 1 ]; then
    CORE_PEER_LOCALMSPID="ManagementPeerOrgMSP"
    CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_MANAGEMENT_PEER_ORG_CA
    CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/management-peer-org.pnu.com/users/Admin@management-peer-org.pnu.com/msp
    CORE_PEER_ADDRESS=peer0.management-peer-org.pnu.com:7051
  elif [ $ORG -eq 2 ]; then
    CORE_PEER_LOCALMSPID="RecClientPeerOrgMSP"
    CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_REC_CLIENT_PEER_ORG_CA
    CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/rec-client-peer-org.pnu.com/users/Admin@rec-client-peer-org.pnu.com/msp
    CORE_PEER_ADDRESS=peer0.rec-client-peer-org.pnu.com:9051
  elif [ $ORG -eq 3 ]; then
    CORE_PEER_LOCALMSPID="Org3MSP"
    CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG3_CA
    CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/organizations/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp
    CORE_PEER_ADDRESS=peer0.org3.example.com:11051
  else
    echo "================== ERROR !!! ORG Unknown =================="
  fi

  if [ "$VERBOSE" == "true" ]; then
    env | grep CORE
  fi
}

verifyResult() {
  if [ $1 -ne 0 ]; then
    echo "!!!!!!!!!!!!!!! "$2" !!!!!!!!!!!!!!!!"
    echo
    exit 1
  fi
}
