/**
 * Created by zh. on 2019/09/01.
 */

import React, {Component} from 'react';
import {
    Linking, Platform, StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native" ;
import { WebView } from "react-native-webview";
import AntDesign from 'react-native-vector-icons/AntDesign';
import {Overlay} from 'teaset';
export default class Browser extends Component {
  constructor(props) {
    super(props);
  }
    static navigationOptions = {
        header: null,
    };
  // 状态
  state = {
      browserUrl:'',
      progressWidth: 0.1 * WIDTH,
      title:'...',
      passwordSwitch:true
  };
  componentDidMount(){
      const { params } = this.props.navigation.state;
      this.setState({
          browserUrl:params.browserUrl
      })
  }
    onLoadEnd = async ({ nativeEvent }) => {
        console.log(nativeEvent)
        let title = nativeEvent.title;
        title = title.substring(0,20);
        Loading.hide();
        this.setState({
            progressWidth: 0,
            title: title
        })
    }
    onError = ({ nativeEvent: errorInfo }) => {
        Loading.hide()
    };
    onLoadProgress = async ({ nativeEvent }) => {
        let progress = parseFloat(nativeEvent.progress);
        if(progress == 1){
            this.setState({
                progressWidth:  WIDTH
            })
        }else{
            let progressWidth = 1-progress;
            this.setState({
                progressWidth: progressWidth.toFixed(2) * WIDTH
            })
        }
    }
  // 渲染
  render() {
      let {browserUrl,title,progressWidth} = this.state
      if(browserUrl){
          return (
              <View style={{ flex: 1, backgroundColor: Theme.commonBackColor }}>
                  <View style={{height:Platform.OS === 'ios'?p(160):p(130),justifyContent: 'center'}}>
                      <View style={{justifyContent: 'center',alignItems:'center'}}>
                          <View style={{justifyContent:'space-between',flexDirection:'row',
                              alignItems:'center',marginTop:p(50),width:WIDTH-p(30)}}>
                              <TouchableOpacity
                                  style={{width:p(65),height:p(55)}}
                                  onPress={()=>this.props.navigation.pop()}>
                                  <AntDesign
                                      name='left'
                                      size={22}
                                      color={Theme.textColor}
                                  />
                              </TouchableOpacity>
                              <Text style={{fontSize:p(26),color:Theme.textColor,fontWeight:'500',left: -p(30)}}>
                                  {title}
                              </Text>
                              <Text/>
                             {/* <TouchableOpacity
                                  onPress={()=> this.showOperationPull()}>
                                  <AntDesign
                                      name='bars'
                                      size={22}
                                      color={Theme.textColor}
                                  />
                              </TouchableOpacity>*/}
                          </View>
                      </View>
                  </View>
                  {
                      parseFloat(progressWidth)>0
                          ?<View style={{width: progressWidth,height:p(5),backgroundColor:'#3c82e9'}}/>
                          :null
                  }
                  <WebView
                      style={{ width: WIDTH, height: HEIGHT }}
                      source={{ uri: browserUrl }}
                      onLoadProgress={this.onLoadProgress}
                      onError={this.onError}
                      onLoadEnd={this.onLoadEnd}
                  />
              </View>
          )
      }else{
          return (
              null
          )
      }
  }
}

const styles = StyleSheet.create({
    linearGradient2: {
        justifyContent:'center',
        flexDirection: 'row',
        alignItems:'center',
        borderBottomColor:'#f5f3f3',
        borderBottomWidth:p(1),
        height:p(155),
    },
    Text_03:{
        fontSize:p(24),
        color:'#2b2a2a',
        marginTop:p(20)
    },
    View_05:{
        justifyContent:'center',
        alignItems:'center',
        width:WIDTH/5,
        height:p(130),
        backgroundColor:'#FFFFFF',
        borderRadius: p(20),
        marginLeft: p(30),
        marginTop: p(20)
    },
    ViewSty:{
        flexDirection:'row',
        borderBottomWidth:p(1),
        borderBottomColor:'#eceaea',
        marginLeft:p(20),
        height: p(120),
        alignItems: 'center'
    },
    Text_01:{
        fontSize: p(26),
        color:'#393838',
    },
    Text_06:{
        fontSize: p(26),
        color:'#292929',
    },
    linearGradient: {
        width: WIDTH-p(100),
        height: p(90),
        borderRadius: p(20),
        justifyContent:'center',
        alignItems:'center'
    },
    buttonText:{
        color:'#FFF',
        fontSize: p(30),
        lineHeight: p(60)
    },

});
