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

  function Plugin(element, options){
    var that = this;
    this.defaultOptions = {
      autoload: true, // create audio element on init, or wait to loadAudio() call.
      exclusive: true, // play only one player at a time
      playtext: 'Play Audio',
      pausetext: 'Pause Audio',
      resumetext: 'Resume Audio',
      playicon: ' &#9658;',
      pauseicon: '&#10073;&#10073;',
      resumeicon: ' &#9658;'
    };

    var settings = $.extend({}, this.defaultOptions, options);

    this.players = [];

    $(element).each(function(){
      var $el = $(this);
      var data = $el.data();

      if (!data.src || !data.duration) {
        warn('Each element must have a src and duration. Skipping this one.');
      } else {

        // override any global settings with local ones?
        var localSettings = $.extend({}, settings, data);

        var markup = [
          '<div class="jab-container" data-index="">',
          '<div class="jab-icon jab-icon-play">'+localSettings.playicon+'</div>',
          '<div class="jab-icon jab-icon-pause">'+localSettings.pauseicon+'</div>',
          '<div class="jab-text jab-text-status">'+localSettings.playtext+'</div>',
          '<div class="jab-text jab-text-timecode">'+secondsToTimecode(localSettings.duration)+'</div>',
          '<div class="jab-progress">',
          '<div class="jab-bar"></div>',
          '</div>',
          '</div>'
        ].join('');

        $el.addClass('jab-init').append(markup);

        that.players.push({
          el: $el,
          progressEl: $el.find('.jab-progress'),
          barEl: $el.find('.jab-bar'),
          text: $el.find('.jab-text-status'),
          loaded: false
        });

        $el.on('click', 'jab-icon', function(){
          console.log('clicky');
        });
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


  // Wrapper around the constructor preventing
  // multiple instantiations on an element
  $.fn[pluginName] = function(options) {
    return new Plugin($(this).not('.jab-init').get(), options);
  };
}));
