/**
 * Created by zenghao on 2018/11/16.
 */

import React, {Component} from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Text, ImageBackground,
} from 'react-native' ;
import {Button} from "../../common/Button";
import {Head} from '../../common/Head';
import {storeWalletSecrets} from '../../api/walletKeyStorage';


export default class ConfirmWords extends Component {

  constructor(props) {
    super(props);
  }
  static navigationOptions = {
    header: null
    // headerTitle: lan.t('wallet.confirmMe')
  };


  // 状态
  state = {
    walletList:[],
    wordsList:[],
    choiceStr:[],
    wordsStr:'',
    choiceWords:'',
    compareWords:'',
    walletInfo:null,
    mnemonic:null,
    walletPassword:'',
    walletName:''
  };


  componentDidMount(){
    const { params } = this.props.navigation.state;
    if(params.walletInfo){
      this.setState({
        mnemonic: params.walletInfo.mnemonic,
        walletInfo: params.walletInfo,
        walletName: params.walletName
      })

      var wordsList = params.walletInfo.mnemonic.split(" ");
      //打乱助记词顺序
      wordsList.sort(function(){ return Math.random() - 0.5 })
      this.setState({
        wordsList:wordsList,
        wordsStr:params.walletInfo.mnemonic,
        compareWords:params.walletInfo.mnemonic
      })

      storage.load({
        key: 'WalletInfoList'
      }).then(data => {
        this.setState({
          walletList:data
        })
      })
      storage.load({
        key: 'walletPassword'
      }).then(data => {
        this.setState({
          walletPassword:data.walletPassword
        })
      })
    }
  }

  //选择助记词
  choiceWords =(words)=>{
    //减少显示的助记词
    var wordsStr = this.state.wordsStr.replace(words,"")
    var wordsList = wordsStr.split(" ");
    wordsList.sort(function(){ return Math.random() - 0.5 })
    this.setState({
      wordsList:wordsList,
      wordsStr:wordsStr
    })
    //增加选中的助记词
    var choiceWords = this.state.choiceWords;
    if(choiceWords!=""){
      choiceWords =choiceWords +","+words
    }else{
      choiceWords = words
    }
    var wordsList = choiceWords.split(",");
    this.setState({
      choiceStr:wordsList,
      choiceWords:choiceWords
    })

  }
  //取消选择
  cancelWords = (words)=>{

    //增加显示的助记词
    var wordsStr = this.state.wordsStr+" "+words;
    var wordsList = wordsStr.split(" ");
    this.setState({
      wordsList:wordsList,
      wordsStr:wordsStr
    })
    //减少选中的助记词
    var choiceWords = this.state.choiceWords.replace(words,"");
    var wordsList = choiceWords.split(",");
    this.setState({
      choiceStr:wordsList,
      choiceWords:choiceWords
    })
  }

  handleSubmit = ()=>{
    //正确的助记词
    var compareWords = this.state.compareWords;
    //用户选择的助记词
    var choiceWords = this.state.choiceWords.split(",");
    var wordsList = "";
    for(var i=0;i<choiceWords.length;i++){
      if(choiceWords[i]!=""){
        if(wordsList!=""){
          wordsList = wordsList+" "+choiceWords[i];
        }else{
          wordsList = choiceWords[i];
        }
      }
    }
    //比较选择的助记词是否相等
    if(compareWords == wordsList){
      let {walletInfo,walletPassword,walletName} = this.state;
      let WalletData = {
        mnemonic:walletInfo.mnemonic,
        privateKey:walletInfo.privateKey,
        address:walletInfo.address,
        password:walletPassword,
        tronAddress:walletInfo.tronAddress,
        name: walletName
      }
      this.state.walletList.push(WalletData);


      Loading.show(lan.t('wal.yanzhengzujichi'));
      let num = 1;
      this.timer = setInterval(() => {
        num--;
        if (num < 0) {
          this.timer && clearInterval(this.timer);
          this.getHome(WalletData);
        }
      }, 500);
    }else{
      Toast.info(lan.t('wallet.clickMe'));
    }
  }

  getHome(WalletData){
    storage.save({
      key: 'WalletInfoList',
      data: this.state.walletList,
    });
    //保存当前的钱包信息
    storage.save({
      key: 'UseWallet',
      data: WalletData
    });
    storeWalletSecrets(WalletData);
    Loading.hide();
    Toast.success(lan.t('wallet.createSuccess'))
    this.props.navigation.replace('MainPage');
  }

  // 渲染
  render() {
    return (
        <View style={{flex:1,backgroundColor:Theme.backgroundColor}}>
          <Head
              leftOnPress={()=>this.props.navigation.goBack()}
              text={lan.t('wallet.confirmMe')}/>
              <Text style={[styles.Text_06,{marginTop: p(80)}]}>
                {lan.t('wallet.trueMe')}
              </Text>
              <View style={{alignItems:'center',justifyContent:'center'}}>
                <View style={{backgroundColor:'#F5F6F8', width:WIDTH-p(60),marginBottom:p(40),
                  justifyContent:'center',
                  minHeight:p(180),
                  borderRadius:p(10),
                  paddingHorizontal:p(16),
                  paddingVertical:p(20)}}>
                  <View style={styles.wordsWrap}>
                    {
                      this.state.choiceStr.filter(item=>item!="").map((item,i)=>{
                        return(
                            <View key={'c'+i} style={styles.wordItem}>
                              <TouchableOpacity
                                  onPress={()=>this.cancelWords(item)}
                                  style={styles.touchableStyle}>
                                <Text style={styles.text_01} numberOfLines={1}>
                                  {item}
                                </Text>
                              </TouchableOpacity>
                            </View>
                        )
                      })
                    }
                  </View>
                </View>

                <View style={{alignItems:'center',justifyContent:'center'}}>
                  <View style={[styles.wordsWrap,{width:WIDTH-p(60)}]}>
                    {
                      this.state.wordsList.filter(item=>item!="").map((item,i)=>{
                        return(
                            <View key={'w'+i} style={styles.wordItem}>
                              <TouchableOpacity
                                  onPress={()=>this.choiceWords(item)}
                                  style={styles.touchableStyle}>
                                <Text style={[styles.text_01,{color: '#FFF'}]} numberOfLines={1}>
                                  {item}
                                </Text>
                              </TouchableOpacity>
                            </View>
                        )
                      })
                    }
                  </View>
                </View>
                <Text style={[styles.Text_06,{color: Theme.remarkColor,fontWeight: '500'}]}>
                  {lan.t('wallet.remark')}
                </Text>

                <Button text={lan.t('all.confirm')}
                        marginTop={p(50)}
                        width={p(100)}
                        onPress={()=>this.handleSubmit()}
                />
              </View>
        </View>

    )
  }

}


const styles = StyleSheet.create({
  Text_06:{
    fontSize:p(24),
    color: Theme.textColor,
    margin: p(30),
    lineHeight:p(40)
  },
  linearGradient: {
    width: WIDTH-p(280),
    height: p(90),
    borderRadius: p(50),
    justifyContent:'center',
    alignItems:'center',
  },
  buttonText: {
    fontSize: p(30),
    color: '#ffffff',
    backgroundColor: 'transparent',
  },
  text_01:{
    fontSize:p(24),
    color: Theme.buttonStyle,
  },
  wordsWrap:{
    flexDirection:'row',
    flexWrap:'wrap',
  },
  wordItem:{
    width:'25%',
    paddingHorizontal:p(4),
    marginBottom:p(16),
  },
  touchableStyle:{
    borderColor:'#e0e0e0',
    borderWidth:p(1),
    alignItems:'center',
    justifyContent:'center',
    borderRadius:p(10),
    height:p(55),
    backgroundColor: '#0D1C3D'
  },
});
