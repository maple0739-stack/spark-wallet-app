import React, { Component } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
} from 'react-native';

export class Button extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }
  render() {
      const {width,backgroundColor,text,textColor,onPress,marginTop,marginBottom} = this.props
      return (
          <View style={{justifyContent:'center',alignItems:'center',
              marginTop: marginTop?marginTop:p(100),
              marginBottom: marginBottom?marginBottom:p(100)}}>
              <TouchableOpacity
                  onPress={onPress?()=>onPress():null}
                  style={{
                      height: p(95),
                      width: width?WIDTH-width:WIDTH-p(100),
                      backgroundColor: backgroundColor?backgroundColor:Theme.buttonStyle,
                      borderRadius:p(50),
                      justifyContent: 'center',
                      alignItems: 'center',
                  }}>
                  <Text style={{
                      color: textColor?textColor:Theme.textColor,
                      fontWeight:'500',
                      fontSize:p(28)
                  }}>
                      {text}
                  </Text>
              </TouchableOpacity>
          </View>
      )
  }
}

const styles = StyleSheet.create({

});
