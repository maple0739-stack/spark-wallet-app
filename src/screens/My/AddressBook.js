/**
 * Created by zh. on 2019/09/01.
 */

import React, {Component} from 'react';
import {
  StyleSheet,
  View,
  ScrollView, TouchableOpacity, Text, Image,
} from 'react-native' ;
import {Head} from "../../common/Head";
import {Button} from '../../common/Button';
import {Overlay} from 'teaset';
import {Input} from 'react-native-elements';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {Images} from '../../resource';
import commonStyles from "../../styles/commonStyles";
export default class AddressBook extends Component {
  constructor(props) {
    super(props);
    this.state = {
      addressBookList:[]
    };
  }
  static navigationOptions = {
    header: null
  };

  componentDidMount(){
    //获取地址列表
    storage.load({
      key: 'AddressBookList'
    }).then(data => {
      this.setState({
        addressBookList: data
      })
    }).catch(e=>{
    })
  }
  addAddressBook(){
    let {walletName,walletAddress,addressBookList} = this.state;
    if(walletName && walletAddress){
      this.overlayPullView.close();

      let addressInfo = {
        walletName: walletName,
        walletAddress: walletAddress
      }
      addressBookList.push(addressInfo);
      this.setState({
        addressBookList:addressBookList
      })
      storage.save({
        key: 'AddressBookList',
        data: addressBookList
      });
    }else{
      Toast.info(lan.t('news.tianxiedizhixinxi'))
    }

  }
  deleteAddress(item){
    this.overlayDeletePullPull.close();
    let {addressBookList} = this.state;
    let addressNewList = [];
    for(let i=0;i<addressBookList.length;i++){
      if(addressBookList[i].walletAddress !== item.walletAddress){
        let addressData = {
          walletAddress:addressBookList[i].walletAddress,
          walletName:addressBookList[i].walletName
        }
        addressNewList.push(addressData);
      }
    }
    this.setState({
      addressBookList:addressNewList
    })
    storage.save({
      key: 'AddressBookList',
      data: addressNewList,
    });

  }
  deleteAddressPull(item){
    let overlayView = (
        <Overlay.PopView
            ref={v => this.overlayDeletePullPull = v}
            style={{alignItems: 'center', justifyContent: 'center'}}
        >
          <View style={{backgroundColor: '#fff', width: WIDTH-p(150), minHeight: p(200), borderRadius: p(10)}}>
            <Text style={{fontSize: p(28),color:'#333333',marginLeft:p(30),marginTop:p(50)}}>
              {lan.t('news.shifuoshanchuqianbaodizhi')}
            </Text>
            <Text style={{fontSize: p(28),color:'#333333',marginLeft:p(30),marginTop:p(50)}}>
             {item.walletAddress}
            </Text>
            <View  style={{alignItems: 'center', justifyContent: 'center'}}>

              <View style={{width:WIDTH-p(180),justifyContent:'flex-end',
                alignItems: 'center',marginTop:p(50),flexDirection:'row',marginBottom: p(20)}}>
                <TouchableOpacity onPress={()=>this.overlayDeletePullPull.close()}>
                  <Text style={{color:'#605f5f',fontWeight:'500',fontSize:p(28)}}>
                    {lan.t('all.cancel')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={{marginLeft:p(50),marginRight:p(20)}}
                                  onPress={()=>this.deleteAddress(item)} >
                  <Text style={{color:Theme.appColor,fontWeight:'500',fontSize:p(28)}}>
                    {lan.t('all.confirm')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Overlay.PopView>
    );
    Overlay.show(overlayView);
  }
  addAddress(){
    let overlayView = (
        <Overlay.PullView ref={v => this.overlayPullView = v}>
          <View style={{backgroundColor: '#FFF', width:WIDTH,borderTopRadius:p(100)}}>
            <View style={{flexDirection:'row',justifyContent:'space-between',marginTop:p(30),alignItems:'center'
              ,marginBottom:p(30)}}>
              <View/>
              <View style={{flexDirection:'row',alignItems:'center',marginLeft:p(20)}}>
                <Text style={{fontSize: p(28),color:'#333333',fontWeight:'500'}}>
                  {lan.t('news.tianjiaqianbaodizhi')}
                </Text>
              </View>
              <TouchableOpacity onPress={()=>this.overlayPullView.close()}>
                <AntDesign
                    name='closecircleo'
                    size={20}
                    color={'#727171'}
                    style={{marginRight:p(15),top:-p(20)}}
                />
              </TouchableOpacity>
            </View>
            <View style={{height:p(20),width:WIDTH,backgroundColor:'#f5f3f3'}}/>

            <Text style={commonStyles.inputTitle}>
              {lan.t('news.dizhibeizhu')}
            </Text>
            <Input
              placeholder= {lan.t('news.shurudizhibeizhu')}
              inputStyle={{color: Theme.textColor,fontSize:p(28)}}
              inputContainerStyle={commonStyles.inputContainer}
              onChangeText={(walletName) => this.setState({walletName})}
            />

            <Text style={commonStyles.inputTitle}>
              {lan.t('news.qianbaodizhi')}
            </Text>
            <Input
              multiline
              placeholder= {lan.t('news.shuruqianbaodizhi')}
              inputStyle={{color: Theme.textColor,fontSize:p(28)}}
              inputContainerStyle={commonStyles.inputMultilineContainer}
              onChangeText={(walletAddress) => this.setState({walletAddress})}
            />

            <TouchableOpacity
                onPress={() => this.addAddressBook()}
                style={{marginTop: p(50),justifyContent:'center',alignItems: 'center',
                  height:p(85),backgroundColor: Theme.buttonStyle}}>
              <Text style={{fontSize: p(28),color:Theme.textColor,fontWeight: '500'}}>
                {lan.t('news.baocun')}
              </Text>
            </TouchableOpacity>

          </View>
        </Overlay.PullView>
    );
    Overlay.show(overlayView);
  }
  // 渲染
  render() {
    let {addressBookList} = this.state;
    return (
        <View style={{flex:1,backgroundColor:Theme.backgroundColor}}>
          <Head text={lan.t('news.dizhibu')} leftOnPress={()=>this.props.navigation.goBack()}/>
          <View style={{alignItems:'center',marginTop: p(50)}}>
            <View>
              <Text style={{fontSize: p(24),color: '#858484'}}>
                温馨提示：长按可删除地址
              </Text>
              <ScrollView>
                {
                  addressBookList && addressBookList.map((item,index)=> {
                    return (
                        <TouchableOpacity
                            onLongPress={()=>this.deleteAddressPull(item)}
                            key={index} style={{
                          width: WIDTH - p(50),
                          backgroundColor: '#F6F7FD',
                          borderRadius: p(10),
                          justifyContent: 'center',
                          marginTop:p(20)
                        }}>
                          <View style={{marginLeft: p(20),marginRight:p(20),marginTop: p(20),marginBottom: p(20)}}>
                            <Text style={{
                              color: '#262525',
                              fontSize: p(28),
                              fontWeight: '500'
                            }}>
                              {item.walletName}
                            </Text>

                            <Text style={{
                              color: '#706d6d',
                              fontSize: p(26),
                              fontWeight: '500',
                              marginTop: p(10)
                            }}>
                              {item.walletAddress}
                            </Text>
                          </View>
                        </TouchableOpacity>
                    )
                  })
                }
              </ScrollView>

              <View style={styles.View01}>
                <Button
                  text= {lan.t('news.xinjianlianxirendizhi')}
                  onPress={()=>this.addAddress()}
                />
              </View>
            </View>
          </View>

        </View>
    )
  }
}


const styles = StyleSheet.create({
  View01:{justifyContent:'center',alignItems:'center',
    marginTop: p(100),
    marginBottom: p(150)},
  Touchable01:{
    height: p(90),
    width:  WIDTH-p(180),
    backgroundColor: Theme.appColor,
    borderRadius:p(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  Text01:{
    color: '#FEFEFE',
    fontWeight:'500',
    fontSize:p(28)
  }
});

