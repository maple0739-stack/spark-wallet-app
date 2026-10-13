import React, { Component } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    default as Easing,
    PermissionsAndroid,
    Platform, TouchableOpacity, ImageBackground
} from 'react-native';
import { RNCamera } from 'react-native-camera';
import AntDesign from "react-native-vector-icons/AntDesign";
import {TOKEN_LIST} from '../../blockchain/TokenInfo';
class ScanScreen extends Component {
    constructor(props) {
        super(props);
        this.state = {
            moveAnim: new Animated.Value(0)
        };
    }
    static navigationOptions = {
        header:null
    };
    // 状态
    state = {
        useChainInfo:null,
        importKey: false,
        onCamera: false
    };
    componentDidMount() {
        const { params } = this.props.navigation.state;
        this.setState({
            useChainInfo: params && params.useChainInfo,
            importKey: params && params.importKey
        })
        this.startAnimation();
    }

    startAnimation = () => {
        this.state.moveAnim.setValue(0);
        Animated.timing(
            this.state.moveAnim,
            {
                toValue: -200,
                duration: 1500,
                easing: Easing.linear
            }
        ).start(() => this.startAnimation());
    };
    isPrivateKey = (text) => {
        return /^(0x)?[0-9a-fA-F]{64}$/.test((text || '').trim());
    };
    isMnemonic = (text) => {
        const words = (text || '').trim().split(/\s+/).filter(Boolean);
        return [12, 15, 18, 21, 24].indexOf(words.length) !== -1;
    };
    isChainAddress = (address, chainSymbol) => {
        const addr = (address || '').trim();
        if(chainSymbol === 'TRX'){
            return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(addr);
        }
        return /^0x[0-9a-fA-F]{40}$/.test(addr);
    };
    //  识别二维码
    onBarCodeRead = (result) => {
        let {useChainInfo,onCamera,importKey} = this.state;
        const {data} = result;
        let toAddress = data;
        if(toAddress && !onCamera){
            this.setState({
                onCamera:true
            })
            if(importKey){
                const key = (toAddress || '').trim();
                if(this.isPrivateKey(key)){
                    this.props.navigation.navigate('ImportWallet',{
                        key: key,
                        tabs: 1
                    })
                }else if(this.isMnemonic(key)){
                    this.props.navigation.navigate('ImportWallet',{
                        key: key,
                        tabs: 2
                    })
                }else{
                    Toast.info(lan.t('wallet.pkFailure'));
                    this.setState({onCamera:false})
                }
            }else{
                const addr = (toAddress || '').trim();
                if(!this.isChainAddress(addr, useChainInfo && useChainInfo.chainSymbol)){
                    Toast.info(lan.t('tt.errorAddress'));
                    this.setState({onCamera:false})
                    return
                }
                this.props.navigation.push('Transfer',{
                    item:TOKEN_LIST[useChainInfo.chainSymbol][0],
                    useChainInfo:useChainInfo,
                    toAddress:addr
                })
            }
        }
    };

    render() {
        return (
            <View style={styles.container}>
                <RNCamera
                    ref={ref => {
                        this.camera = ref;
                    }}
                    style={styles.preview}
                    type={RNCamera.Constants.Type.back}
                    flashMode={RNCamera.Constants.FlashMode.on}
                    onBarCodeRead={this.onBarCodeRead}
                >
                    <View style={styles.header}>
                        <View style={styles.headerRow}>
                            <TouchableOpacity
                                onPress={()=>this.props.navigation.goBack()}
                                style={styles.backBtn}>
                                <AntDesign
                                    name='left'
                                    size={20}
                                    color='#FFF'
                                />
                                <Text style={{fontSize: p(26),color: '#FFF'}}>
                                    {lan.t('all.back')}
                                </Text>
                            </TouchableOpacity>
                            {/*<Text style={{fontSize: p(30),fontWeight:'500',color: '#FFF',marginRight:p(90)}}>
                                {lan.t('tt.payInfo')}
                            </Text>*/}
                            <View/>
                        </View>
                    </View>
                    <View style={styles.rectangleContainer}>
                        <Text style={styles.rectangleText}>
                            {lan.t('tt.payCode')}
                        </Text>
                        <View style={styles.rectangle}/>
                        <Animated.View style={[
                            styles.border,
                            {transform: [{translateY: this.state.moveAnim}]}]}/>
                    </View>
                </RNCamera>
            </View>
        );
    }
}

export default ScanScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    preview: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'flex-end',
        alignItems: 'center'
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        backgroundColor: 'transparent',
        height: Platform.OS === 'ios' ? p(175) : p(140),
        justifyContent: 'center',
    },
    headerRow: {
        justifyContent: 'space-between',
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: p(50),
    },
    backBtn: {
        marginLeft: p(20),
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    rectangleContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        top: -p(100)
    },
    rectangle: {
        height: 200,
        width: 200,
        borderWidth: 2,
        borderColor: '#2a61b3',
        backgroundColor: 'transparent'
    },
    rectangleText: {
        flex: 0,
        color: '#FFF',
        marginBottom: p(50),
        fontSize: p(30),
        fontWeight: '500'
    },
    border: {
        flex: 0,
        width: 200,
        height: 2,
        backgroundColor: '#2a61b3',
    }
});
