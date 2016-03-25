/**
 * @preserve jabradoodle - v0.0.1 - 2016-03-25
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
  var $body = $('body');

  function Plugin(element, options){
    this.defaultOptions = {
      preload: true, // create audio element on init, or wait to loadAudio() call.
      exclusive: true, // play only one player at a time
      showduration: true,
      showprogressbar: true,
      showelapsedtime: false,
      playtext: 'Play Audio',
      pausetext: 'Pause Audio',
      resumetext: 'Resume Audio',
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
          '<div class="jab-text jab-inline-el jab-text-status">'+localSettings.playtext+'</div>',
          '<div class="jab-text jab-inline-el jab-text-duration">'+secondsToTimecode(localSettings.duration)+'</div>',
          '<div class="jab-progress"><div class="jab-bar"></div></div>'
        ].join('');


        // Classes on the main element dictate what is shown.
        var initClasses = 'jab-container jab-init jab-state-inactive';

        [{
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
        }, {
          setting: 'showelapsedtime',
          value: 'elapsedtime'
        }].forEach(function(option){
          if (localSettings[option.setting]) {
            initClasses = initClasses + ' jab-show-' + option.value;
          }
        });

        $el.addClass(initClasses).append(markup);


        // obj represents player as a UI and functionality
        var player = {
          $el: $el,
          $progress: $el.find('.jab-progress'),
          $bar: $el.find('.jab-bar'),
          $text: $el.find('.jab-text-status'),
          settings: localSettings,

          // load and bind events
          load: function(){
            if (!this.audio) {
              this.$audio  = $('<audio class="jab-audio" src="' + this.settings.src + '"></audio>').appendTo($body);
              this.audio = this.$audio[0];
              this.$audio.on('play', this._onPlay.bind(this));
              this.$audio.on('pause', this._onPause.bind(this));
              this.$audio.on('timeupdate', this._onTimeUpdate.bind(this));
              this.$audio.on('ended', this._onEnded.bind(this));
            }
          },

          // audio element event handlers
          _onPlay: function(){
            var player = this;

            // stop other players?
            if (settings.exclusive) {
              players.forEach(function(otherPlayer){
                if (otherPlayer !== player) otherPlayer.audio.pause();
              });
            }

            containerClass(el, 'jab-state', 'active');
            player.$text.html(player.settings.pausetext);
            $el.trigger( 'play', this);
          },

          _onPause: function(){
            var player = this;
            containerClass(el, 'jab-state', 'pause');
            player.$text.html(player.settings.resumetext);
            $el.trigger( 'pause', this);
          },

          _onEnded: function(){
            var player = this;
            containerClass(el, 'jab-state', 'inactive');
            player.$text.html(player.settings.playtext);
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
          player.load();

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


  /**
   * Convert number of seconds into time object
   * http://codeaid.net/javascript/convert-seconds-to-hours-minutes-and-seconds-%28javascript%29
   * Released under http://creativecommons.org/licenses/by/3.0/.
   *
   * @param Number  seconds, as integer, to convert
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
