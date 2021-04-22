/* eslint-disable */
/* Let CRA handle linting for sample app */
import React, { Component } from 'react';
import Spinner from 'react-spinner';
import classNames from 'classnames';
import logo from './logo.svg';
import { OpenTokSDK } from 'opentok-accelerator-core';
import credentials from './credentials.json';
import './App.css';
import 'opentok-solutions-css';
// import './../public/ptz-control';


const otSDK = new OpenTokSDK(credentials);

const callProperties = {
  insertMode: 'append',
  width: '100%',
  height: '100%',
  showControls: false,
  style: {
    buttonDisplayMode: 'off'
  }
};



/**
 * Build classes for container elements based on state
 * @param {Object} state
 * @returns {Object}
 */
const containerClasses = (state) => {
  const { active, meta, localAudioEnabled, localVideoEnabled } = state;
  const sharingScreen = meta ? !!meta.publisher.screen : false;
  const viewingSharedScreen = meta ? meta.subscriber.screen : false;
  const activeCameraSubscribers = meta ? meta.subscriber.camera : 0;
  return {
    controlClass: classNames('App-control-container', { 'hidden': !active }),
    localAudioClass: classNames('ots-video-control circle audio', { 'muted': !localAudioEnabled }),
    localVideoClass: classNames('ots-video-control circle video', { 'muted': !localVideoEnabled }),
    cameraPublisherClass: classNames('video-container', { 'hidden': !active, 'small': !!activeCameraSubscribers || sharingScreen, 'left': sharingScreen || viewingSharedScreen }),
    screenPublisherClass: classNames('video-container', { 'hidden': !sharingScreen }),
    cameraSubscriberClass: classNames('video-container', { 'hidden': !activeCameraSubscribers },
      `active-${activeCameraSubscribers}`, { 'small': viewingSharedScreen || sharingScreen }
    ),
    screenSubscriberClass: classNames('video-container', { 'hidden': !viewingSharedScreen }),
  };
};

const connectingMask = () =>
  <div className="App-mask">
    <Spinner />
    <div className="message with-spinner">Connecting</div>
  </div>;

const startCallMask = start =>
  <div className="App-mask">
    <div className="message button clickable" onClick={start}>Click to Start Call</div>
  </div>;


class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      session: null,
      connected: false,
      active: false,
      publishers: null,
      subscribers: null,
      meta: null,
      streamMap: null,
      localPublisherId: null,
      localAudioEnabled: true,
      localVideoEnabled: true,
    };
    this.startCall = this.startCall.bind(this);
    this.toggleLocalAudio = this.toggleLocalAudio.bind(this);
    this.toggleLocalVideo = this.toggleLocalVideo.bind(this);
    this.sendSignal = this.sendSignal.bind(this);
    // this.zoomEl = document.querySelector("#showVideo input[name='zoom']");
    // const zoomRef  = React.createRef();
    // this.zoomRef = this.zoomEl;
    console.log(this.zoomEl);
    console.log('Here only');
  }

  componentDidMount() {
    const session = otSDK.session;
    otSDK.connect().then(() => {this.setState({ session, connected: true })
   this.state.session.connections.forEach(function(x,y){console.log(x,y)});
   if(this.state.session.connections.length() ==1){
     debugger;
     this.state.session.connection.data={hero:true};
    this.state.session.signal(
      {
        // to: this.state.session.connection,
        data:{
          type:'hero',
          delta: this.state.session.connection.id
        }
      },
      function(error) {
        if (error) {
          console.log("signal error ("
                       + error.name
                       + "): " + error.message);
        } else {
          console.log("signal sent.!!");
        }
      }
    );
   }else{
    this.state.session.connections.forEach(function(x,y){
      debugger;
      if(x.data && x.data.hero){
        this.state.heroId = x.data.id;
        console.log("hero found");
      }
    });
   }
  });
   
    // this.zoomEl = document.querySelector("input[name='zoom']");
    
  }

  startCall() {
    const { session, streamMap } = this.state;

    const subscribeToStream = stream => {
      if (streamMap && streamMap[stream.id]) { return; }
      const type = stream.videoType;
      otSDK.subscribe(stream, `${type}SubscriberContainer`, callProperties)
      .then(() => { this.setState(otSDK.state()) 
        console.log("=====camera publisher id=====",stream);});
    };

    // Subscribe to initial streams
    session.streams.forEach(subscribeToStream);

    // Subscribe to new streams and update state when streams are destroyed
    otSDK.on({
      'streamCreated' : ({ stream }) => subscribeToStream(stream),
      'streamDestroyed': ({ stream }) => this.setState(otSDK.state())
    });

    // Publish local camera stream
    otSDK.publish('cameraPublisherContainer', callProperties)
    .then((publisher) => {
      this.setState(Object.assign({}, otSDK.state(), { localPublisherId: publisher.id }));
      console.log("=====My publisher id=====",publisher.id);
    }).catch(error => console.log(error));

    
    this.setState({ active: true });
    const that=this;
    console.log("=====My Connection Id=====",session.connection.id);
    session.on("signal", function(event) {
      console.log("Signal sent from connection " + event.from.id);
      // if(event.from.id != that.state.session.connection.id ){
        const data = JSON.parse(event.data);
        if(data.type =="zoom" || data.type =="pan"  || data.type =="tilt" ){
          var event1 = document.createEvent('Event');
          event1.initEvent('input', true, true);
          console.log(that[data.type+"El"]);
          that[data.type+"El"].value = (that[data.type+"El"].value*1)+ (data.delta ? 10 : -10);
          that[data.type+"El"].dispatchEvent(event1);
        }
      // console.log(that.zoomEl.value);
      // that.zoomEl.value = (that.zoomEl.value*1) + 10;
      console.log(that.zoomEl.value);
      // that.zoomEl.click();
     
      console.log(that);
      console.log('Here only');
      // }else if(event.from.id != that.state.session.connection.id){
      //   if(event.data.type =="hero"){
      //     that.state.heroId = event.from.id;
      //     console.log("====hero received", that.state.heroId);
      //   }
         
      // }
      // handleSignal(100);
      // Process the event.data property, if there is any data.
      // console.log(this.zoomRef);
      // console.log(this.zoomEl);
    });
  }

  toggleLocalAudio() {
    const { localPublisherId, publishers, localAudioEnabled } = this.state;
    const enabled = !localAudioEnabled;
    otSDK.enablePublisherAudio(enabled);
    this.setState({ localAudioEnabled: enabled });
  }

  toggleLocalVideo() {
    const { localPublisherId, publishers, localVideoEnabled } = this.state;
    const enabled = !localVideoEnabled;
    otSDK.enablePublisherVideo(enabled);

    this.setState({ localVideoEnabled: enabled });
  }
 sendSignal(){
   const conId= this.state.session.connection;
   console.log(conId);
   console.log("signal sent by button", arguments);
   var data = {
    type:arguments[1],
    delta: arguments[2]
  };
  this.state.session.signal(
    {
       to: arguments[0],
      data:JSON.stringify(data)
    },
    function(error) {
      if (error) {
        console.log("signal error ("
                     + error.name
                     + "): " + error.message,error.code);
      } else {
        console.log("signal sent.");
      }
    }
  );
 }
  render() {
    const { connected, active } = this.state;
    console.log('Here')
    console.log(this.state);
    const {
      localAudioClass,
      localVideoClass,
      controlClass,
      cameraPublisherClass,
      screenPublisherClass,
      cameraSubscriberClass,
      screenSubscriberClass,
    } = containerClasses(this.state);
    let connectionId = null,connectionCtrls=[];
    this.zoomEl = document.querySelector("input[name='zoom']");
    this.panEl = document.querySelector("input[name='pan']");
    this.tiltEl = document.querySelector("input[name='tilt']");
    if (this.state.session) {
      this.state.session.connections.forEach(function (x, y) { console.log(x, y) });
      connectionId = this.state.session.connection.id;
      const that=this;
      this.state.session.connections.map(function (connection) {
        if (connectionId != connection.id) {
          connectionCtrls.push(<div> {connection.id}
            <div class="zoomperconnection"> <button onClick={that.sendSignal.bind(that, connection, 'zoom', true)}> Zoom +</button>
              <button onClick={that.sendSignal.bind(that, connection, 'zoom', false)}> Zoom -</button></div>
            <div class="panperconnection"> <button onClick={that.sendSignal.bind(that, connection, 'pan', true)}> pan +</button>
              <button onClick={that.sendSignal.bind(that, connection, 'pan', false)}> Pan -</button></div>
            <div class="tiltperconnection"> <button onClick={that.sendSignal.bind(that, connection, 'tilt', true)}> tilt +</button>
              <button onClick={that.sendSignal.bind(that, connection, 'tilt', false)}> tilt -</button></div>
          </div>);
        }
      }, this);
    }
    
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1>OpenTok Accelerator Core</h1>
        </div>
        <div className="App-main">
          <div id="controls" className={controlClass}>
            <div className={localAudioClass} onClick={this.toggleLocalAudio}></div>
            <div className={localVideoClass} onClick={this.toggleLocalVideo}></div>
          </div>
          <div className="App-video-container">
            { !connected && connectingMask() }
            { connected && !active && startCallMask(this.startCall)}
            <div id="cameraPublisherContainer" className={cameraPublisherClass}></div>
            <div id="screenPublisherContainer" className={screenPublisherClass}></div>
            <div id="cameraSubscriberContainer" className={cameraSubscriberClass}></div>
            <div id="screenSubscriberContainer" className={screenSubscriberClass}></div>
          </div>
          <div>My Connection Id {this.state.session && this.state.session.connection.id}</div>
          <div id="chat" className="App-chat-container"></div>
         
          {connectionCtrls}
        </div>
        
      </div>
    );
  }
}

export default App;
