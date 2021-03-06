// Store 是資料改變的地方，single source of truth，指的就是所有的狀態都應該被保存在 store
var AppDispatcher = require('../dispatcher/AppDispatcher');

// 需要 dispatcher，因為 dispatcher 廣播不同的東西，store 必須 reigster 並且決定如何處理
var AppConstants = require('../constants/AppConstants');

// 因為 store 改變之後要通知 view，所以需要有廣播的能力
var EventEmitter = require('events').EventEmitter;

// 讓 store 繼承 EventEmitter 一樣有幾種不同寫法，merge, assign 或是 jQuery 的 .$extend
var merge = require('react/lib/merge');
var assign = require('object-assign');

// store 改變之後廣播出去的內容
var CHANGE_EVENT = 'change';
var Firebase = require('firebase');


// Store 分成三個大部分：private, public, register self

//========================================================================
//
// Private vars & method

// 定義 store 需要的變數和 method，外界看不到
var _data = {};
_data.questions = require('../../data/data.js');// Question data
_data.totalVote = 0;

//利用 assign 做部分 update
//updates 為需要更新的部分, {key: value}
//assign (target, ...sources)
function _update(updates) {
  //_books[id] = assign({}, _books[id], updates);
  
  // A, B, C, D to 0, 1, 2, 3
  var index = updates.index.charCodeAt(0)-65;//65:'A'
  var ref = new Firebase('https://qa10.firebaseio.com/questionVotesRecord/'+updates.id+'/votes/'+index);
  ref.transaction(function (current_value) {
    return (current_value || 0) + 1;
  });

}
function _getTotalCount() {
  
  var ref = new Firebase('https://qa10.firebaseio.com/totalVotesCount');
  ref.on('value', function(snap) {

      _data.totalVote = snap.val().votes;
      console.log("TOTAL TEST COUNT:"+_data.totalVote);
      AppStore.emitChange();

  });

}
function _updateTotalCount() {//+1
  
  var ref = new Firebase('https://qa10.firebaseio.com/totalVotesCount/votes');
  ref.transaction(function (current_value) {
    return (current_value || 0) + 1;
  });

}

//========================================================================
//
// Public API 外界可以呼叫的方法

var AppStore = merge(EventEmitter.prototype, {
// assign 的寫法
// var TodoStore = assign({}, EventEmitter.prototype, {

  getData: function() {
    return _data;
  },

  //為什麼這個要定義成 public ?
  emitChange: function() {
    this.emit(CHANGE_EVENT);
  },

  addChangeListener: function(callback) {
    this.on(CHANGE_EVENT, callback);
  },

  removeChangeListener: function(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  }

  
});

//========================================================================
//
// Load vote data & total count

var ref = new Firebase('https://qa10.firebaseio.com/questionVotesRecord');
ref.on('value', function(snap) {
  
  var votes = snap.val();
  for(var key in _data.questions){
      if(votes[key]){
        
        //console.log(votes[key]);
        //console.log(_data[key].options);

        //Update voting data
        for(var i in _data.questions[key].options){
            //console.log(_data[key].options[i].votes);
            //console.log(votes[key].votes[i]);
            _data.questions[key].options[i].votes = votes[key].votes[i];
        }
  
      }
  }

  _getTotalCount();
  // AppStore.emitChange();

});

//========================================================================
//
// event handlers

/**
 * 向 Dispatcher 註冊自已，才能偵聽到系統發出的事件
 */

AppDispatcher.register(function(action) {
  
  switch(action.actionType) {
    
    case AppConstants.VOTE_UPDATE:
      _update(action.item);
      AppStore.emitChange();
      break;
    
    case AppConstants.VOTE_UPDATE_TOTAL_COUNT:
      _updateTotalCount();
      AppStore.emitChange();
      break;

    default:
      // no op
  }
});

module.exports = AppStore;
