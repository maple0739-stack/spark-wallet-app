import React, { Component } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity, Platform, Image,
} from "react-native";
import AntDesign from 'react-native-vector-icons/AntDesign';

export class Head extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }
  render() {
      const {text,leftOnPress,textColor,rightOnPress,rightTab} = this.props
      return (
          <View style={{flexDirection:'row',marginTop: Platform.OS === 'ios'?p(100):p(70),
              alignItems:'center',justifyContent:'space-between',paddingLeft:p(20)}}>
              <TouchableOpacity
                  onPress={leftOnPress?()=>leftOnPress():null}
                  style={{height:p(55),justifyContent:'center',alignItems:'center',flexDirection:'row'}}>
                  <AntDesign
                      name='left'
                      size= {22}
                      color= {textColor?textColor:'#242424'}
                  />
                  <Text style={{fontSize: p(30),color: textColor?textColor:'#242424',fontWeight:'500',marginLeft:p(8)}}>
                      {text}
                  </Text>
              </TouchableOpacity>
              {
                  rightTab === 'importWallet' ?
                      <TouchableOpacity onPress={rightOnPress?()=>rightOnPress():null} style={{marginRight: p(20)}}>
                          <Image style={{width: p(65),height: p(65)}}
                                 source={require('../resource/image/nana/ico5.png')}/>
                      </TouchableOpacity>
                      :null
              }
          </View>
      )
  }
}

const styles = StyleSheet.create({

});
