import React, { Component } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList } from 'react-native';
import * as Permissions from 'expo-permissions';
import { Camera } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';

import Clarifai from 'clarifai';

const clarifai = new Clarifai.App({
  apiKey: '5de3a74bf9ac48c9ac03f2bf803a1424'
});
process.nextTick = setImmediate;

export default class App extends Component {
  state = {
    hasCameraPermission: null,
    type: Camera.Constants.Type.back,
    predictions: []
  };
  async componentWillMount() {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({ hasCameraPermission: status === 'granted' });
  }
  capturePhoto = async () => {
    if(this.camera) {
      let photo = await this.camera.takePictureAsync();
      return photo.uri;
    }
  };
  resize = async (photo) => {
    let manipulatedImage = await ImageManipulator.manipulateAsync(
      photo,
      [{ resize: { height: 300, width: 300 } }],
      { base64: true }
    );
    return manipulatedImage.base64;
  };
  predict = async (image) => {
    let predictions = await clarifai.models.predict(
      Clarifai.GENERAL_MODEL,
      image
    )
    return predictions;
  }
  objectDetection = async () => {
    let photo = await this.capturePhoto();
    let resized = await this.resize(photo);
    let predictions = await this.predict(resized);
    this.setState({ predictions: predictions.outputs[0].data.concepts });
  }
  render() {
    const { hasCameraPermission, predictions } = this.state;
    if( hasCameraPermission === null ) {
      return <View />
    } else if (hasCameraPermission === false) {
      return <Text>No access to camera</Text>;
    } else {
      return(
        <View style={ styles.container }>
          <Camera style={{ flex: 1 }} type={ this.state.type } ref={ ref => this.camera = ref }>
            <View style={styles.buttonView}>
              <View style={styles.flatContainer}>
                <FlatList 
                  data={predictions.map(prediction => ({
                    key: `${prediction.name}${prediction.value}`,
                  }))}
                  renderItem={({item}) => (
                    <Text style={styles.itemStyle}>{item.key}</Text>
                  )}
                />
              </View>
              <TouchableOpacity style={styles.touchableStyle} onPress={() => {
                // this.setState({
                //   type: this.state.type === Camera.Constants.Type.back
                //   ? Camera.Constants.Type.front
                //   : Camera.Constants.Type.back,
                // })
                this.objectDetection()
              }}>
                <Text style={styles.textStyle}>
                  {' '}Detect Objects{' '}
                </Text>
              </TouchableOpacity>
            </View>
          </Camera>
        </View>
      );
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 15
  },
  buttonView: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  touchableStyle: {
    flex: 0.1,
    alignSelf: 'flex-end',
    alignItems: 'center'
  },
  textStyle: {
    fontSize: 20,
    marginBottom: 10,
    paddingRight: 15,
    color: 'white'
  },
  flatContainer: {
    flex: 1,
    alignSelf: 'flex-start',
    alignItems: 'center'
  },
  itemStyle: {
    paddingLeft: 15,
    color: 'white',
    fontSize: 20
  }
});
