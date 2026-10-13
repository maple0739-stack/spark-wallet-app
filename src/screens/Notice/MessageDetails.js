/**
 * Created by zh. on 2019/09/01.
 */

import React, {Component} from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView
} from 'react-native' ;
import HTMLView from 'react-native-htmlview';
export default class MessageDetails extends Component {
  constructor(props) {
    super(props);
  }
  static navigationOptions = {
    headerTitle: '公告详情',
  };
  // 状态
  state = {
    isRefresh:false,
    item:null
  };

  componentDidMount(){
    const { params } = this.props.navigation.state;
    this.setState({
      item:params.item
    })
  }

  _onRefresh(){
    this.setState({
      isRefresh:false
    })
  }

  // 渲染
  render() {
    const {item} = this.state;
    return (
        <View style={{ flex: 1, backgroundColor: Theme.commonBackColor }}>
          <View style={{justifyContent:'center',alignItems:'center'}}>
            <Text style={styles.Text_01}>
              {item?item.title:''}
            </Text>
            <View style={{width:WIDTH-p(50),justifyContent:'space-between',flexDirection:'row',marginBottom:p(30)}}>
              <Text/>
              <Text style={styles.Text_02}>
                {item?item.created:''}
              </Text>
            </View>
            <ScrollView>
              <View style={{width:WIDTH-p(50),marginBottom:p(130)}}>
                <HTMLView
                    value={item?item.content:''}
                />
              </View>
            </ScrollView>
          </View>
        </View>

    )
  }

}


const styles = StyleSheet.create({
  Text_03:{
    fontSize:p(24),
    color:'#636363',
    marginTop:p(20)
  },
  Text_02:{
    fontSize:p(26),
    color:'#484848',
    marginTop:p(40)
  },
  Text_01:{
    fontSize:p(30),
    color:'#313131',
    fontWeight:'500',
    marginTop:p(50)
  },
});

