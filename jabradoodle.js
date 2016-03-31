/**
 * @preserve jabradoodle - v0.0.4 - 2016-03-25
 * jQuery Audio Button + 🐩
 * http://sjwilliams.github.io/jabradoodle/
 * Copyright (c) 2016 Josh Williams; Licensed MIT
 */

(function(factory) {
  if (typeof define === 'function' && define.amd) {
    define(['jquery'], factory);
  } else {
    factory(jQuery);
  }
}(function($) {

  var pluginName = 'jabradoodle';
  var statePrefix = 'jab-state';
  var $body = $('body');

  function Plugin(element, options){
    this.defaultOptions = {
      preload: false, // create audio element on init and start download, or wait until button click.
      exclusive: true, // play only one player at a time
      fillcontainer: false, // whether or not the button expands as wide as the container it's in (display block vs display table)
      showduration: true, // show duration in MM:SS format
      showprogressbar: true, // show the moving progress bar in the background
      showloader: true, // show the loading icon while audio is downloading
      iconsmaintainwidth: true,
      buttonmaintainswidth: true,
      statusmaintainwidth: false,
      playtext: 'Play',
      pausetext: 'Pause',
      resumetext: 'Resume',
      playicon: ' &#9658;',
      pauseicon: '&#10073;&#10073;',
      resumeicon: ' &#9658;'
    };

    var settings = $.extend({}, this.defaultOptions, options);
    var players = [];

    $(element).each(function(){
      var el = this;
      var $el = $(el);
      var data = $el.data();

      if (!data.src || !data.duration) {
        warn('Each element must have a src and duration. Skipping this one.');
      } else {

        // override any global settings with local ones
        var localSettings = $.extend({}, settings, data);

        var markup = [
          '<div class="jab-icon jab-inline-el jab-icon-play">'+localSettings.playicon+'</div>',
          '<div class="jab-icon jab-inline-el jab-icon-pause">'+localSettings.pauseicon+'</div>',
          '<div class="jab-icon jab-inline-el jab-icon-resume">'+localSettings.resumeicon+'</div>',
          '<div class="jab-icon jab-inline-el jab-icon-loader"><div class="jab-loader"></div></div>',
          '<div class="jab-text jab-inline-el jab-text-play">'+localSettings.playtext+'</div>',
          '<div class="jab-text jab-inline-el jab-text-pause">'+localSettings.pausetext+'</div>',
          '<div class="jab-text jab-inline-el jab-text-resume">'+localSettings.resumetext+'</div>',
          '<div class="jab-text jab-inline-el jab-text-duration">'+secondsToTimecode(localSettings.duration)+'</div>',
          '<div class="jab-progress"><div class="jab-bar"></div></div>'
        ].join('');


        // Classes on the main element dictate what is shown.
        var initClasses = 'jab-container jab-init';

        [{
          setting: 'fillcontainer',
          value: 'fillcontainer'
        },{
          setting: 'playtext',
          value: 'status'
        }, {
          setting: 'playicon',
          value: 'icons'
        }, {
          setting: 'showduration',
          value: 'duration'
        }, {
          setting: 'showprogressbar',
          value: 'progressbar'
        }].forEach(function(option){
          if (localSettings[option.setting]) {
            initClasses = initClasses + ' jab-show-' + option.value;
          }
        });


        // Append new markup
        $el.addClass(initClasses).append(markup);

        // Maintain equal spacing between icons / text messages?
        if (localSettings.iconsmaintainwidth) {
          equalHorizontalWidth($('.jab-icon', $el));
        }

        if (localSettings.statusmaintainwidth) {
          equalHorizontalWidth($('.jab-text', $el));
        }

        // Set button to the max possible size of any state
        if (localSettings.buttonmaintainswidth) {
          var maxButtonWidth = Math.max.apply(null, [
            'active',
            'pause',
            'loading',
            'inactive' // end on this, the default state
          ].map(function(state){
            containerClass(el, statePrefix, state);
            return $el.width();
          }));

          $el.css('min-width', maxButtonWidth);
        }

        $el.addClass('jab-post-init');

        // obj represents player UI and functionality
        var player = {
          $el: $el,
          $progress: $el.find('.jab-progress'),
          $bar: $el.find('.jab-bar'),
          settings: localSettings,

          /**
           * Load and bind events.
           */
          load: function(){
            if (!this.audio) {
              this.$audio  = $('<audio class="jab-audio" src="' + this.settings.src + '"></audio>').appendTo($body);
              this.audio = this.$audio[0];
              this.$audio.on('play', this._onPlay.bind(this));
              this.$audio.on('pause', this._onPause.bind(this));
              this.$audio.on('timeupdate', this._onTimeUpdate.bind(this));
              this.$audio.on('ended', this._onEnded.bind(this));
              this.$audio.on('loadstart', this._onLoadStart.bind(this));
              this.$audio.on('canplaythrough', this._onLoadEnd.bind(this));
            }
          },

          /**
           * Return the state of the player. It's
           * based on the jab-state-* class name
           * on the container.
           *
           * 'jab-state-active' returns 'active', etc.
           *
           * @return {String}
           */
          getState: function(){
            var classList = Array.prototype.slice.call(el.classList);
            for (var i = classList.length - 1; i >= 0; i--) {
              if (classList[i].lastIndexOf(statePrefix + '-') === 0) {
                return classList[i].split('-')[2]; // bail early if we find it. and only return the last part of jab-state-active
              }

            }
            return; // not found. return undefined.
          },


          // audio element event handlers
          _onLoadStart: function(){
            if (this.settings.showloader) {
              this._preLoadingState = this.getState();
              containerClass(el, statePrefix, 'loading');
            }
          },

          _onLoadEnd: function(){
            if (this.settings.showloader) {

              // on return to preLoad state if, in fact,
              // user has requested a new state, which would
              // have updated current getState way from 'loading'
              if (this.getState() === 'loading') {
                containerClass(el, statePrefix, this._preLoadingState);
              }
            }

            $el.trigger('load', this);
          },

          _onPlay: function(){
            var player = this;

            // stop other players?
            if (player.settings.exclusive) {
              players.forEach(function(otherPlayer){
                if (otherPlayer !== player && otherPlayer.audio && !otherPlayer.audio.paused) {
                  otherPlayer.audio.pause();
                }
              });
            }

            containerClass(el, statePrefix, 'active');
            $el.trigger( 'play', this);
          },

          _onPause: function(){
            var player = this;
            containerClass(el, statePrefix, 'pause');
            $el.trigger( 'pause', this);
          },

          _onEnded: function(){
            var player = this;
            containerClass(el, statePrefix, 'inactive');
            $el.trigger( 'ended', this);
          },

          _onTimeUpdate: function(){
            var player = this;
            var duration = player.audio.duration || player.settings.duration;
            var percentComplete;
            var width;

            if (duration && duration >= 1) {
              percentComplete = (player.audio.currentTime / duration);
              width = Math.floor(player.$progress.width() * percentComplete);
              player.$bar.css('width', width);
            }

            $el.trigger('timeupdate', this);
          }
        };


        // bind play/pause
        player.$el.on('click', function(){
          player.load(); // incase preload was set to false

          if (player.audio.paused) {
            player.audio.play();
          } else {
            player.audio.pause();
          }
        });


        // preload audio?
        if (player.settings.preload) {
          player.load();
        }

        // add to running list of players
        players.push(player);
      }
    });
  }

  function warn(msg){
    console.log(pluginName + ': ' + msg);
  }

  function die(msg){
    throw new Error(pluginName + ': ' + msg);
  }


  function equalHorizontalWidth($els){
    var maxWidth = Math.max.apply(null, $els.map(function() {
      return Math.ceil($(this).width());
    }).get());

    $els.width(maxWidth);
  }


  /**
   * Convert number of seconds into object with time parts.
   *
   * 92 to:
   *
   * {
   *  h: 0,
   *  m: 1,
   *  s: 32
   * }
   *
   * From: http://codeaid.net/javascript/convert-seconds-to-hours-minutes-and-seconds-%28javascript%29
   * Released under http://creativecommons.org/licenses/by/3.0/.
   *
   * @param Number  seconds, as integer
   * @return object
   */
  function secondsToTime(secs){
    var hours = Math.floor(secs / (60 * 60));

    var divisor_for_minutes = secs % (60 * 60);
    var minutes = Math.floor(divisor_for_minutes / 60);

    var divisor_for_seconds = divisor_for_minutes % 60;
    var seconds = Math.ceil(divisor_for_seconds);
    seconds = '0' + seconds; // cast to string with a padded zero, in case we need it
    seconds = seconds.substr(-2); // return last two digets

    var obj = {
      "h": hours,
      "m": minutes,
      "s": seconds
    };
    return obj;
  }

  /**
   * Convert seconds as integer into timecode string.
   *
   * @param  {Number} secs Timecode in seconds, like: 92
   * @return {String}      Timecdoe as string, like: 1:32
   */
  function secondsToTimecode(secs){
    var obj = secondsToTime(secs);
    return obj.m + ':' + obj.s;
  }


  /**
   * Given a prefix string like 'theme' and a value like
   * 'dark', add 'theme-dark' class to the given element
   * after removing any other theme-* classes.
   *
   * Extracted from, see for details:
   * https://www.npmjs.com/package/container-class
   *
   * @param  {Object} el     Target DOM element
   * @param  {String} prefix Broad prefix slug/category, before the '-' separator.
   * @param  {String} value  Specific suffix value, after the '-' separator.
   */
  function containerClass(el, prefix, value){
    var classList = Array.prototype.slice.call(el.classList);
    classList.forEach(function(c){
      if (c.lastIndexOf(prefix + '-') === 0 ){
        el.classList.remove(c);
      }
    });
    el.classList.add(prefix+'-'+value);
  }



  // Wrapper around the constructor preventing
  // multiple instantiations on an element
  $.fn[pluginName] = function(options) {
    return new Plugin($(this).not('.jab-init').get(), options);
  };
}));
