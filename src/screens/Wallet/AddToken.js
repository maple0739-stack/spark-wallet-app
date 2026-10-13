/**
 * Created by zh. on 2019/09/01.
 */

import React, {Component} from 'react';
import {
    View,
    Text, StyleSheet, TouchableOpacity, DeviceEventEmitter, ImageBackground,
} from 'react-native' ;
import {Input} from 'react-native-elements';
import {Head} from '../../common/Head';
import {Button} from '../../common/Button';
import commonStyles from "../../styles/commonStyles";
export default class AddToken extends Component {
    constructor(props) {
        super(props);
    }
    static navigationOptions = {
        header: null,
    };
    // 状态
    state = {
        tokenDecimals:'',
        tokenName:'',
        tokenSymbol:'',
        tokenAddress:'',
        totalSupply:'',
        tokenList:[]
    };
    componentDidMount(){
        let key = useChainInfo.chainSymbol+'-AddTokenList';
        storage.load({
            key: key
        }).then(data => {
            console.log("AddTokenList",data)
            this.setState({
                tokenList:data
            })
        })
    }
    loadTokenAddress(tokenAddress){
        if(tokenAddress && tokenAddress.length == 42){
            this.setState({
                tokenAddress:tokenAddress
            })
            BlockChainService.getTokenName(tokenAddress).then(data => {
                this.setState({
                    tokenName:data
                })
            })
            BlockChainService.getTokenSymbol(tokenAddress).then(data => {
                this.setState({
                    tokenSymbol:data
                })
            })
            BlockChainService.getTokenDecimals(tokenAddress).then(data => {
                if(data){
                    this.setState({
                        tokenDecimals:data+""
                    })
                    this.getTokenSupply(tokenAddress,data);
                }
            })
        }else{
            Toast.info('error')
        }
    }
    getTokenSupply(tokenAddress,decimals){
        BlockChainService.getTokenSupply(tokenAddress).then(data => {
            let supply = data / Math.pow(10,parseInt(decimals));
            this.setState({
                totalSupply:supply+""
            })
        })
    }
    trueAdd(){
        let {tokenAddress,tokenDecimals,tokenSymbol,tokenName,tokenList} = this.state;
        if(tokenAddress && tokenDecimals && tokenSymbol){
            let addTokenList = {
                address: tokenAddress,
                name: tokenName,
                symbol: tokenSymbol,
                decimals: tokenDecimals
            }
            tokenList.push(addTokenList);
            let key = useChainInfo.chainSymbol+'-AddTokenList';
            storage.save({
                key: key,
                data: tokenList
            });
            Toast.success(lan.t('all.success'))
            DeviceEventEmitter.emit("addTokenList", null);
            this.props.navigation.goBack();
        }else{
            Toast.info('error')
        }
    }
    // 渲染
    render() {
        return (
            <View style={{ flex: 1 ,backgroundColor: Theme.backgroundColor}}>
                <Head
                    text={lan.t('token.tianjiadaibi')}
                    leftOnPress={()=>this.props.navigation.goBack()}
                />
                <View style={{justifyContent: 'center',alignItems: 'center'}}>
                    <View style={{width:WIDTH-p(30)}}>

                        <Text style={commonStyles.inputTitle}>
                            {lan.t('token.daibiheyue')}：
                        </Text>
                        <Input
                          multiline
                          placeholder= {lan.t('token.qingshurudaibidizhi')}
                          inputStyle={{color: Theme.textColor,fontSize:p(28)}}
                          inputContainerStyle={commonStyles.inputMultilineContainer}
                          onChangeText={(tokenAddress) => this.loadTokenAddress(tokenAddress)}
                        />

                        <Text style={commonStyles.inputTitle}>
                            {lan.t('token.daibifuhao')}
                        </Text>
                        <Input
                          placeholder= {lan.t('token.daibifuhao')}
                          inputStyle={{color: Theme.textColor,fontSize:p(28)}}
                          inputContainerStyle={commonStyles.inputContainer}
                          value={this.state.tokenSymbol}
                        />

                        <Text style={commonStyles.inputTitle}>
                            {lan.t('token.daibimingcheng')}
                        </Text>
                        <Input
                          placeholder= {lan.t('token.daibimingcheng')}
                          inputStyle={{color: Theme.textColor,fontSize:p(28)}}
                          inputContainerStyle={commonStyles.inputContainer}
                          value={this.state.tokenName}
                        />

                        <Text style={commonStyles.inputTitle}>
                            {lan.t('token.daibijingdu')}
                        </Text>
                        <Input
                          placeholder= {lan.t('token.daibijingdu')}
                          inputStyle={{color: Theme.textColor,fontSize:p(28)}}
                          inputContainerStyle={commonStyles.inputContainer}
                          value={this.state.tokenDecimals}
                        />

                        <Text style={commonStyles.inputTitle}>
                            {lan.t('token.faxingshuliang')}
                        </Text>
                        <Input
                          placeholder= {lan.t('token.faxingshuliang')}
                          inputStyle={{color: Theme.textColor,fontSize:p(28)}}
                          inputContainerStyle={commonStyles.inputContainer}
                          value={this.state.totalSupply}
                        />
                    </View>
                    <Button
                        text={ lan.t('all.confirm')}
                        onPress={()=>this.trueAdd()}/>
                </View>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    linearGradient: {
        width: WIDTH/3+p(50),
        height: p(85),
        justifyContent:'center',
        alignItems:'center',
    },
    TextSty4:{
        color:'#262829',
        fontWeight:'500',
        fontSize:p(30)
    },
    TouchableSty:{
        height: p(85),
        width:WIDTH/3+p(50),
        backgroundColor: Theme.buttonStyle,
        borderRadius:p(30),
        justifyContent: 'center',
        alignItems: 'center',
    },
    TextSty1:{
        fontSize:p(28),
        color:'#484747',
        marginTop: p(50)
    },
    ViewSty1:{
        justifyContent:'space-between',
        alignItems:'center',
        flexDirection:'row',
        marginTop:p(5)
    },
});
