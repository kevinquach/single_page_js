/*
 * spa.chat.js
 * Chat feature module for SPA
*/

/*jslint       browser: true, continue: true,
 devel : true, indent : 2,    maxerr  : 50,
 newcap: true, nomen  : true, plusplus: true,
 regexp: true, sloppy : true, vars    : false,
 white : true
*/

/*global $, spa */

spa.chat = (function () {
  'use strict';
  //------------- BEGIN MODULE SCOPE VARIABLES -------------
  var
    configMap = {
      main_html : String()
        + '<div class="spa-chat">'
          + '<div class="spa-chat-head">'
            + '<div class="spa-chat-head-toggle">+</div>'
            + '<div class="spa-chat-head-title">'
              + 'Chat'
            + '</div>'
          + '</div>'
          + '<div class="spa-chat-closer">x</div>'
          + '<div class="spa-chat-sizer">'
            + '<div class="spa-chat-list">'
              + '<div class="spa-chat-list-box"></div>'
            + '</div>'
            + '<div class="spa-chat-msg">'
              + '<div class="spa-chat-msg-log"></div>'
              + '<div class="spa-chat-msg-in">'
                + '<form class="spa-chat-msg-form">'
                + '<input type="text"/>'
                + '<input type="submit" style="display:none"/>'
                + '<div class="spa-chat-msg-send">'
                  + 'send'
                + '</div>'
              + '</form>'
            + '</div>'
          + '</div>'
        + '</div>'
      + '</div>',

      settable_map : {
        slider_open_time   : true,
        slider_close_time  : true,
        slider_opened_em   : true,
        slider_closed_em   : true,
        slider_opened_title: true,
        slider_closed_title: true,

        chat_model     : true,
        people_model   : true,
        set_chat_anchor: true
      },

      slider_open_time     : 250,
      slider_close_time    : 250,
      slider_opened_em     : 18,
      slider_closed_em     : 2,
      slider_opened_title  : 'Tap to close',
      slider_closed_title  : 'Tap to open',
      slider_opened_min_em : 10,
      window_height_min_em : 20,

      chat_model      : null,
      people_model    : null,
      set_chat_anchor : null
    },

    stateMap  = {
      $append_target  : null,
      position_type   : 'closed',
      px_per_em       : 0,
      slider_hidden_px: 0,
      slider_closed_px: 0,
      slider_opened_px: 0
    },
    jqueryMap = {},

    setJqueryMap, getEmSize, setPxSizes, setSliderPosition,
    onClickToggle, configModule, initModule, scrollChat,
    writeChat, writeAlert, clearChat, onTapToggle,
    onSubmitMsg, onTapList, onSetchatee, onUpdatechat,
    onListChange, onLogin, onLogout,
    removeSlider, handleResize;


  //---------- END MODULE SCOPE VARIABLES ----------

  //------------ BEGIN UTILITY METHODS -------------
  //------------- END UTILITY METHODS --------------

  //------------- BEGIN DOM METHODS ----------------
  // Begin DOM method /setJqueryMap/
  setJqueryMap = function () {
    var
      $append_target = stateMap.$append_target,
      $slider        = $append_target.find( '.spa-chat' );

    jqueryMap = {
      $slider   : $slider,
      $head     : $slider.find( '.spa-chat-head' ),
      $toggle   : $slider.find( '.spa-chat-head-toggle' ),
      $title    : $slider.find( '.spa-chat-head-title' ),
      $sizer    : $slider.find( '.spa-chat-sizer' ),
      $input    : $slider.find( '.spa-chat-msg-in input[type=text]' ),
      $closer   : $slider.find( '.spa-chat-closer'),
      $list_box : $slider.find( '.spa-chat-list-box'),
      $msg_log  : $slider.find( '.spa-chat-msg-log'),
      $msg_in   : $slider.find( '.spa-chat-msg-in'),
      $send     : $slider.find( '.spa-chat-msg-send'),
      $form     : $slider.find( '.spa-chat-msg-form'),
      $window   : $(window)
    };
  };
  // End DOM method /setJqueryMap/

  // Begin DOM method /setPxSizes/
  setPxSizes = function () {
    var px_per_em, window_height_em, opened_height_em;

    px_per_em = spa.util_b.getEmSize( jqueryMap.$slider.get(0) );
    window_height_em = Math.floor(
      ( jqueryMap.$window.height() / px_per_em ) + 0.5
    );

    opened_height_em
      = window_height_em > configMap.window_height_min_em
      ? configMap.slider_opened_em
      : configMap.slider_opened_min_em;

    stateMap.px_per_em        = px_per_em;
    stateMap.slider_closed_px = configMap.slider_closed_em * px_per_em;
    stateMap.slider_opened_px = opened_height_em * px_per_em;
    jqueryMap.$sizer.css({
      height: ( opened_height_em - 2 ) * px_per_em
    });
  };
  // End DOM method /setPxSizes/

  // Begin DOM method /setSliderPosition/
  // Example : spa.chat.setSliderPosition( 'closed' );
  // Purpose : Move the chat slider to the requested position
  // Arguments : // * position_type - enum('closed', 'opened', or 'hidden')
  // * callback -  optional callback to be run at the end
  // of slider animation. The callback receives a jQuery
  // collection representing the slider div as its single
  // argument
  // Action :
  // This method moves the slider into the request position.
  // If the requested position is the current position, it
  // returns true without taking further action
  // Returns :
  // * true - The requested position was achieved
  // * false - The requested position was not achieved
  // Throws : none
  //
  setSliderPosition = function ( position_type, callback ) {
    var
      height_px, animate_time, slider_title, toggle_text;

    // position type of 'opened' is not allowed for anon user;
    // therefore we simply return false; the shell will fix the
    // uri and try again.
    if ( position_type === 'opened'
      && configMap.people_model.get_user().get_is_anon()
      ){ return false; }

    // return true if slider is already in requested position
    if ( position_type === 'opened' ) {
      jqueryMap.$input.focus();
    }
    return true;

    // prepare animate parameters
    switch ( position_type ) {
      case 'opened' :
        height_px    = stateMap.slider_opened_px;
        animate_time = configMap.slider_open_time;
        slider_title = configMap.slider_opened_title;
        toggle_text  = '-';
        jqueryMap.$input.focus();
      break;

      case 'hidden' :
        height_px    = 0;
        animate_time = configMap.slider_open_time;
        slider_title = '';
        toggle_text  = '+';
      break;

      case 'closed' :
        height_px    = stateMap.slider_closed_px;
        animate_time = configMap.slider_close_time;
        slider_title = configMap.slider_closed_title;
        toggle_text  = "+";
      break;

      // bail for unknown position_type
      default : return false;
    }

    // animate slider position change
    stateMap.position_type = '';
    jqueryMap.$slider.animate(
      { height : height_px },
      animate_time,
      function () {
        jqueryMap.$toggle.prop( 'title', slider_title );
        jqueryMap.$toggle.text( toggle_text );
        stateMap.position_type = position_type;
        if ( callback ) { callback( jqueryMap.$slider ); }
      }
    );
    return true;
  };
  // End public DOM method /setSliderPosition/

  // Begin private DOM methods
  var $msg_log = jqueryMap.$msg_log;
  $msg_log.animate(
    { scrollTop : $msg_log.prop( 'scrollHeight' )
    $msg_log.height()

  //-------------- END DOM METHODS -----------------

  //------------ BEGIN EVENT HANDLERS --------------
  onClickToggle = function ( event ) {
    var set_chat_anchor = configMap.set_chat_anchor;
    if ( stateMap.position_type === 'opened' ) {
      set_chat_anchor( 'closed' );
    }
    else if ( stateMap.position_type === 'closed' ) {
      set_chat_anchor( 'opened' );
    }
    return false;
  };

  //------------- END EVENT METHODS ----------------

  //------------ BEGIN PUBLIC METHODS --------------
  // Begin public method /handleResize/
  // Purpose  :
  //   Given a window resize event, adjust the presentation
  //   provided by this module if needed
  // Actions  :
  //   If the window height or width falls below
  //   a given threshold, resize the chat slider for the
  //   reduced window size.
  // Returns  : Boolean
  //   * false - resize not considered
  //   * true  - resize considered
  // Throws   : none
  //
  handleResize = function () {
    // don't do anything if we don't have a slider container
    if ( ! jqueryMap.$slider ) { return false; }

    setPxSizes();
    if ( stateMap.position_type === 'opened') {
      jqueryMap.$slider.css( { height : stateMap.slider_opened_px } );
    }
    return true;
  };

  // Begin public method /removeSlider/
  // Purpose  :
  //   * Removes chatSlider DOM element
  //   * Reverts to initial state
  //   * Removes pointers to callbacks and other data
  // Arguments: none
  // Returns  : true
  // Throws   : none
  //
  removeSlider = function () {
    // unwind initialization and state
    // remove DOM container; this removes event bindings too
    if ( jqueryMap.$slider ) {
      jqueryMap.$slider.remove();
      jqueryMap = {};
    }
    stateMap.$append_target = null;
    stateMap.position_type  = 'closed';

    // unwind key configurations
    configMap.chat_model      = null;
    configMap.people_model    = null;
    configMap.set_chat_anchor = null;

    return true;
  };
  // End public method /removeSlider/

  // End public method /handleResize/

  // Begin public method /configModule/
  // Example  : spa.chat.configModule({ slider_open_em : 18 });
  // Purpose  : Configure the module prior to initialization
  // Arguments:
  //   * set_chat_anchor - a callback to modify the URI anchor to
  //     indicate opened or closed state. This callback must return
  //     false if the requested state cannot be met
  //   * chat_model - the chat model object provides methods
  //       to interact with our instant messaging
  //   * people_model - the people model object which provides
  //       methods to manage the list of people the model maintains
  //   * slider_* settings. All these are optional scalars.
  //       See mapConfig.settable_map for a full list
  //       Example: slider_open_em is the open height in em's
  // Action   :
  //   The internal configuration data structure (configMap) is
  //   updated with provided arguments. No other actions are taken.
  // Returns  : true
  // Throws   : Javascript error object and stack trace on
  //            unacceptable or missing arguments
  configModule = function ( input_map ) {
    spa.util.setConfigMap({
      input_map    : input_map,
      settable_map : configMap.settable_map,
      config_map   : configMap
    });
    return true;
  };
  // End public method /configModule/

  // Begin public method /initModule/
  // Example  : spa.chat.initModule( $('#div_id') );
  // Purpose  : Directs Chat to offer its capability to the user
  // Arguments:
  //  * $append_target (example: $('#div_id') ).
  //    A jQuery collection that should represent
  //    a single DOM container
  // Action   :
  //   Appends the chat slider to the provided container and fills
  //   it with HTML content. It then initializes elements,
  //   events, and handlers to provide the user with a chat-room
  //   interface
  // Returns  : true on success, false on failure
  // Throws   : none
  //
  initModule = function ( $append_target ) {
    $append_target.append( configMap.main_html );
    stateMap.$append_target = $append_target;
    setJqueryMap();
    setPxSizes();

    // initializes chat slider to default title and state
    jqueryMap.$toggle.prop( 'title', configMap.slider_closed_title );
    jqueryMap.$head.click( onClickToggle );
    jqueryMap.$closer.click( removeSlider );
    stateMap.position_type = 'closed';

    return true;
  };
  // End public method /initModule/

  // return public methods
  return {
    setSliderPosition : setSliderPosition,
    configModule      : configModule,
    initModule        : initModule,
    removeSlider      : removeSlider,
    handleResize      : handleResize
  };
  //------------ END PUBLIC METHODS ----------------
}());