/**
 * Created by zh. on 2019/09/01.
 */

import React, {Component} from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity
} from 'react-native' ;

export default class PlatformMessage extends Component {
  constructor(props) {
    super(props);
  }
  static navigationOptions = {
    headerTitle: lan.t('my.platMessage')
  };
  // 状态
  state = {
    isRefresh:false,
    list:[],
    pageNum:0,//页数
    pageSize:10,//条数
    total:10//总条数
  };

  componentDidMount(){
    this.getList();
  }
  getList(){
    const {pageSize,total} = this.state;
    let pageNum = this.state.pageNum;
    let totalSize = pageNum * pageSize;
    if(totalSize >= total){
      return;
    }
    pageNum++;
    const params  = {
      pageSize: pageSize,
      pageNum: pageNum,
      status:0
    }
    AjaxAction.betsContextList(params).then(result => {
      if(result){
        let arr = this.state.list;
        if(arr.length > 0){
          arr.push(...result.rows);
          this.setState({
            list:arr,
            pageNum:pageNum
          })
        }else{
          this.setState({
            list:result.rows,
            pageNum:pageNum,
            total:result.total
          })
        }
      }
    })
  }
  _onRefresh(){
    this.setState({
      isRefresh: false
    })
  }
  // 渲染
  render() {
    return (
        <View style={{ flex: 1, backgroundColor: Theme.commonBackColor }}>
          <View style={{justifyContent:'center',alignItems:'center'}}>
            <View style={{width:WIDTH-p(50)}}>
              <FlatList
                  style={styles.container}
                  data={this.state.list}
                  //加载更多
                  onEndReached={() => this.getList()}
                  onEndReachedThreshold={1}
                  //item显示的布局
                  renderItem={({item}) =>
                  {
                    return(
                        <TouchableOpacity
                            onPress={()=>this.props.navigation.push('MessageDetails',{item:item})}
                            style={{ borderBottomWidth:p(1),borderBottomColor:'#e2e2e2'}}>
                          <View style={styles.View_01}>
                              <Text style={styles.Text_01}>
                                {item.title}
                              </Text>
                          </View>
                          <View style={{alignItems:'flex-end'}}>
                            <Text style={styles.Text_02}>
                              {item.created}
                            </Text>
                          </View>

                        </TouchableOpacity>

                    )
                  }
                  }
                  refreshControl={
                    <RefreshControl
                        title={'Loading'}
                        colors={['red']}
                        refreshing={this.state.isRefresh}
                        onRefresh={() => {
                          this._onRefresh();
                        }}
                    />
                  }
                  onEndReachedThreshold={0.1}
              />
            </View>
          </View>
        </View>

    )
  }

}


const styles = StyleSheet.create({
  Text_02:{
    fontSize:p(26),
    color:'#484848',
    marginBottom:p(20),
    marginTop: p(20)
  },
  Text_01:{
    fontSize:p(28),
    color:'#4b4b4b',
    fontWeight:'500'
  },
  View_01:{
    flexDirection:'row',
    alignItems:'center',
    marginTop: p(20)
  }
});

