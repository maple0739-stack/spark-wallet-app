/**
 * Created by zh on 2019/08/08.
 * 我的页面
 * my page
 */
import React, { Component } from 'react';
import {
  View, Image, ScrollView, StyleSheet, StatusBar, ImageBackground, Text, TouchableOpacity,
  DeviceEventEmitter, Platform,
} from "react-native";
import AntDesign from "react-native-vector-icons/AntDesign";
import {Input} from "react-native-elements";
import I18n from "react-native-i18n";
export default class DappIndex extends Component {
  constructor(props) {
    super(props);
  }
    static navigationOptions = {
        header: null,
    };
  state={
      url:'',
      DappList:[]
  }
  componentDidMount() {
      storage.load({
          key: 'DappUrl'
      }).then(data => {
          this.setState({
              DappList:data
          })
      })
  }
  deleteDappList(){
      storage.remove({
          key: 'DappUrl',
      });
      this.setState({
          DappList:null
      })
  }
  onInputText(url){
      if(url){
          this.setState({
              url:url
          })
      }
  }
  getBrowser(){
      this.state.DappList.push(this.state.url);
      storage.save({
          key: 'DappUrl',
          data: this.state.DappList,
      });
      this.props.navigation.push('DappBrowser',{browserUrl:this.state.url})
  }
  render() {
      let {url,DappList} = this.state;
    return (
        <View style={{flex:1,backgroundColor:Theme.backgroundColor}}>

            <View style={{alignItems:'center',justifyContent:'center',marginTop:Platform.OS === 'ios'?p(100):p(75)}}>
              <View style={{justifyContent:'space-between',alignItems:'center',flexDirection:'row',width:WIDTH-p(20)}}>
                <View style={{width: WIDTH-p(80)}}>
                  <Input
                    leftIcon={{
                      type: 'antdesign',
                      name: 'search1',
                      color: '#acabab',
                      size: p(40)
                    }}
                    leftIconContainerStyle={{marginLeft: p(10)}}
                    placeholder={lan.t('news.shousuodapp')}
                    inputStyle={{color:'#373735',fontSize:p(28),fontWeight:'500',
                      marginLeft:p(20)}}
                    inputContainerStyle={{borderWidth:p(0),borderRadius: p(10),
                      height:p(75),borderBottomColor: '#c4c4c4'}}
                    onChangeText={(url) => this.setState({url})}
                  />
                </View>
                {
                  I18n.locale == 'zh'?
                  <TouchableOpacity onPress={()=>this.props.navigation.goBack()}>
                    <Text style={styles.TextSty}>
                      {lan.t('all.cancel')}
                    </Text>
                  </TouchableOpacity>
                    :
                    <TouchableOpacity onPress={()=>this.props.navigation.goBack()}>
                      <AntDesign
                        name='logout'
                        size={20}
                        color={'#484747'}
                        style={{marginRight: p(15)}}
                      />
                    </TouchableOpacity>
                }
              </View>
            </View>

          <View style={{width: WIDTH-p(50),marginLeft:p(15)}}>
            {
              url?
                <TouchableOpacity onPress={()=>this.getBrowser()}
                  style={{marginTop: p(50),flexDirection:'row',marginLeft: p(15)}}>
                  <AntDesign
                    name='find'
                    size={18}
                    color={'#484747'}
                    style={{marginRight: p(6)}}
                  />
                  <Text style={{color: Theme.appColor,fontSize:p(28),marginLeft: p(10),fontWeight:'500'}}>
                    {url}
                  </Text>
                </TouchableOpacity>
                :
                <View>
                  <View style={{justifyContent:'space-between',alignItems:'center',flexDirection:'row',
                    width:WIDTH-p(50),marginTop:p(50)}}>
                    <View style={{flexDirection:'row',alignItems:'center'}}>
                      <AntDesign
                        name='clockcircle'
                        size={16}
                        color={Theme.appColor}
                      />
                      <Text style={{color:'#373636',fontSize:p(28),marginLeft: p(10)}}>
                        {lan.t('nana.lishijilu')}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={()=>this.deleteDappList()}>
                      <AntDesign
                        name='delete'
                        size={20}
                        color={'#484747'}
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.lineSty}/>
                  {
                    DappList && DappList.map((item,index)=> {
                      return (
                        <TouchableOpacity
                          onPress={()=>this.props.navigation.push('DappBrowser',{browserUrl:item})}
                          style={{height: p(100),justifyContent:'center',borderBottomWidth:p(1),
                            borderBottomColor:'#e2e2e2'}}
                          key={index}>
                          <Text style={{color:'#373636',fontSize:p(24)}}>
                            {item}
                          </Text>
                        </TouchableOpacity>
                      )
                    })
                  }
                </View>
            }
          </View>

        </View>
    );
  }
}

const styles = StyleSheet.create({
    lineSty:{
        height:p(1),
        backgroundColor:'#e2e2e2',
        width:WIDTH-p(50),
        marginTop:p(10)
    },
    TextSty:{
        color:'#1d1d1d',
        fontSize:p(28),
    },
})
