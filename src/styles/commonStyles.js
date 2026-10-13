/**
 * Created by zh on 2019/08/08.
 * 样式统一配置文件
 * Styles uniform profile
 */
import { StyleSheet } from 'react-native';

/**
 * ListItem padding 统一上下为 10
 * ListItem padding top and bottom uniform set 10
 */
const commonStyles = StyleSheet.create({
  itemPadding: { paddingTop: p(24), paddingBottom: p(24) },
  slide1: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#9DD6EB'
  },
  slide2: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#97CAE5'
  },
  slide3: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#92BBD9'
  },
  text: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold'
  },
  inputTitle: {
    fontSize:p(26),
    color:'#0D1C3D',
    fontWeight: '500',
    marginTop:p(50),
    marginLeft: p(20),
    marginBottom: p(20)
  },
  inputContainer: {
    borderWidth: p(1),
    borderColor: '#e4e4e4',
    borderRadius: p(20),
    paddingHorizontal: p(20),
    height: p(90),
    justifyContent: 'center',
  },
  inputMultilineContainer: {
    borderWidth: p(1),
    borderColor: '#e4e4e4',
    borderRadius: p(20),
    paddingHorizontal: p(20),
    paddingTop: p(10),
    paddingBottom: p(20),
    alignItems: 'flex-start',
  },
  inputContent:{
    color: Theme.textColor,
    fontSize:p(28)
  },
  touchableOpacityButton:{
    height: p(95),
    width:  WIDTH-p(100),
    backgroundColor: Theme.buttonStyle,
    borderRadius:p(50),
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row'
  },
});

export default commonStyles;
