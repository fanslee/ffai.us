Wap35 = function(){
    this.loading = null;
    this.wdshow = null;
    this.events = {};
    this.isMobile = false;
    this.apptype = null;
    this.shareData = null;
    this.chinfo = {};
    this.utils = new Wap35Utils(this);
    switch(arguments.length){
        case 0:
            break;
        case 1:
            if(typeof arguments[0] == "object"){
                this.options = this.utils.extend(this.options, arguments[0]);
            }
            break;
    };
    this.init();

};
Wap35.prototype.init = function(){
    this.isMobile = this.utils.isMobile();
    this.apptype = this.utils.getAppType();
    if(this.isMobile) this.hideSusPend();

    if(this.apptype == 'ios') this.showMoTan();

    this.autoJudge();
    this.wap35ch = new Wap35CH(this);
    //专区微端显示
    this.wdshow = document.getElementById('weiduan');
    if(this.wdshow){
        this.showWeiDuan();
    }
    //统计
    this.count();
    this.showPointMsg();
};
Wap35.prototype.scroll = function(){
    var _this = this;
    var scroll = function(){
        var scrollTop = document.body.scrollTop ;
        var scrollHeight = document.body.scrollHeight ;
        var windowHeight = window.innerHeight ;
        if(scrollTop + windowHeight == scrollHeight){
            _this.getMorelist();
        };
        setTimeout(scroll, 2000)
    };
    scroll();
};
Wap35.prototype.autoJudge = function(){
    if(document.getElementById("btnSendCode")){
        this.security();
    };
    if(document.getElementById("loading")){
        this.scroll();
    };

};
//显示公众号
Wap35.prototype.openPublicMp = function(){
    var laytan = document.getElementById("laytan");
    if(laytan) laytan.parentElement.removeChild(laytan);

    var laytan = document.createElement("div");
    laytan.id = 'laytan';
    laytan.className = 'laytan';

    var title = '96KaiFa源码';
    var qrcode = '/96kaifa/statics/wap_v1/images/erweima_2.jpg';
    if(this.chinfo && this.chinfo.id>20){
        if (this.chinfo.title) title = this.chinfo.title;
        if (this.chinfo.qrcode) qrcode = this.chinfo.qrcode;
    }

    var html = '<div class="laysha">' +
        ' <div class="erwei"> ' +
        '<div class="chat"> <div class="chat_hd">操作提示 <i class="close" id="close"></i> </div> ' +
        '<div class="chat_bd"> ' +
        '<p>关注【<strong>'+ title +'</strong>】公众号，方便下次继续玩</p> ' +
        '<div class="wei"> <img src="'+ qrcode +'"> </div> ' +
        '<span>扫描或长按识别二维码关注</span> ';

    if(!this.chinfo.id || !this.chinfo.qrcode)
    {
        html += '<a class="yxh" href="javascript:;" onclick="wap35.downApp(8);"><i></i>下载游戏盒，免费领取所有礼包~</a> ';
    };
    html += '</div> </div> </div> </div> ';
    laytan.innerHTML =  html;
    document.getElementsByTagName('body')[0].appendChild(laytan);
    var close = document.getElementById('close');
    close.addEventListener('click',function(){
        laytan.style.display = "none";
    });
    laytan.style.display = "block";
};
Wap35.prototype.downApp = function(pid){
    var _this = this;
    var android = _this.utils.isAndroid();
    var ios =_this.utils.isIOS();
    $.getJSON('/api/position.html',{pid:pid},function(res){
        if(res.code == 1){
            if(ios){
                window.location.href = res.data[2]['url']
            }else{
                window.location.href = res.data[1]['url']
            }
        }
    });
};
Wap35.prototype.hideSusPend = function(){
    var suspend = document.getElementById('suspend');
    if(suspend){
        suspend.style.display = 'none';
    }
};
Wap35.prototype.showMoTan = function(){
    if(this.utils.getCookie('motan')) return ;
    var motan = document.getElementById("motan");
    if(motan){
        var _this = this;
        motan.style.display = "block";
        motan.addEventListener('click',function(){
            motan.style.display = "none";
            _this.utils.setCookie('motan','true');
        });
    }
};
Wap35.prototype.getMorelist = function(){
    var loading = document.getElementById("loading");
    if(!loading) return ;
    var type = $("#loading").parent("div").attr("id");
    var page = $("#loading").attr("page");
    switch (type){
        case 'open':
            showOpenList(type,page);
            break;
        case 'search':
            showSearchList(type,page);
            break;
        case 'search_open':
            showSearchOpenList(type,page);
            break;
        /*************/
        case 'newgame':
            showNewGame(type,page);
            break;
        case 'alonegame':
            showAloneGame(type,page);
            break
        case 'newopen':
            showNewOpen(type,page);
            break;
        case 'todayopen':
            showTodayOpen(type,page);
            break;
        case 'soonopen':
            showSoonOpen(type,page);
            break;
        case 'newslist':
            showNewsList(type,page);
            break;
        case 'sortslist':
            showSortsList(type,page);
            break
        case 'gamenewlist':
            showGameNewList(type,page);
            break;
        case 'alonesortslist':
            showAloneSortsList(type,page);
            break;
    };
    var _this = this;
    setTimeout(function(){
        _this.replaceUrl();
    },1000);
};
Wap35.prototype.showOpenCode = function(id){
    $.getJSON("/userinfo/code.html",{'id':id},function(data){
        if(data.status!=1) return;
        var laytan = document.getElementById('laytan');
        var html = '<div class="laysha">' +
            '<div class="erwei"><div class="chat"><div class="chat_hd">操作提示 <i class="close" id="close"></i> ' +
            '</div> <div class="lq_succ ck"> <p class="ckone">请长按复制下方的礼包码</p>' +
            ' <p class="lqtwo">'+ data.code +'</p> </div> </div> </div> </div>';
        if(!laytan){
            laytan = document.createElement("div");
            laytan.id = 'laytan';
            laytan.className = 'laytan';
            document.getElementsByTagName('body')[0].appendChild(laytan);
        }
        laytan.innerHTML = html;
        laytan.style.display = "block";
        var close = document.getElementById('close');
        close.addEventListener('click',function(){
            laytan.style.display = "none";
        })
    })
};
Wap35.prototype.getOpenCode = function(openid){
    var returl = window.location.href;
    var iswx = this.utils.getAppType() == 'wx' ? '1' : '0;'
    $.getJSON("/getCode.html",{'openid':openid,'iswx':iswx},function(data){
        if(data.status==-2) {
            window.location.href = "/userinfo/login.html?return="+returl;
            return;
        }
        var laytan = document.getElementById("laytan");
        var html ='';
        if(data.status==-1){
            html = '<div class="laysha"> <div class="erwei" style="text-align: left;"> <div class="chat"> <div class="chat_hd">领取结果<i class="close" id="close"></i> </div><div class="lq_fail"> <p style="padding: 0.2rem 0.2rem;">' + data.msg + '</p> </div> </div> </div> </div>'
        }else{
             html = '<div class="laysha"> <div class="erwei"> <div class="chat"> <div class="chat_hd">领取结果<i class="close" id="close"></i> </div><div class="lq_succ"> <p class="lqone">领取成功，请尽快使用，以免卡号失效！</p> <p class="lqtwo">'+ data.opencode +'</p> <span>手动复制</span> <p class="lqtip" id="lqtip"><a href="'+ data.gameurl +'">游戏内悬浮提示 </a></p> </div> </div> </div> </div>'
        }
        if(!laytan){
            laytan = document.createElement('div');
            laytan.id = 'laytan';
            laytan.className = 'laytan';
            document.getElementsByTagName('body')[0].appendChild(laytan);
        }
        laytan.innerHTML = html;
        laytan.style.display = "block";
        var close = document.getElementById("close");
        close.addEventListener('click',function(){
            laytan.style.display = "none";
        })
    })
};
Wap35.prototype.showMsg = function(msg){
    var laytan = document.getElementById('laytan');
    var html = '<div class="laysha"><div class="erwei"> <div class="chat"> <div class="chat_hd"> 操作提示 <i class="close" id="close"></i> </div> <div class="tan_ti">'+ msg +'</div> </div> </div> </div>';
    if(!laytan){
        laytan = document.createElement('div');
        laytan.id = 'laytan';
        laytan.className = 'laytan';
        document.getElementsByTagName('body')[0].appendChild(laytan);
    }
    laytan.innerHTML = html;
    laytan.style.display = 'block';
    var close = document.getElementById('close');
    close.addEventListener('click',function(){
        laytan.style.display = 'none';
    })
};
Wap35.prototype.showPointMsg = function(){
    var url = this.utils.getOrigin() + "";
    var _this = this;
    $.getJSON(url,'',function(data){
        if(data.status==1)
            _this.msgPoint(data.msgid,data.uid);
        _this.tabPoint(data.dowid,data.newid,data.opnid);
    });
};
Wap35.prototype.msgPoint = function(msgid,uid){
    var _this = this;
    if(msgid && msgid != _this.utils.getCookie('msgid'+uid)){
        if($("#mine").length>0) $("#mine").addClass('hong');
        var msg = document.getElementById('msg');
        if(!msg) return;
        msg.className = "hong";
        var point = document.getElementById("point");
        point.addEventListener('click',function(){
            _this.utils.setCookie('msgid'+uid,msgid);
        });
    }
};
Wap35.prototype.tabPoint = function(dowid,newid,opnid){
    var tab;
    $(".thex_hd li").each(function(index,obj){
        if($(obj).hasClass('tab_2')) tab = index;
    });
    if(tab==1) this.utils.setCookie('dowid',dowid);
    if(tab==3) this.utils.setCookie('newid',newid);
    if(tab==4) this.utils.setCookie('opnid',opnid);
    if(dowid && tab!=1 && dowid != this.utils.getCookie('dowid')){
        $(".thex_hd ul>li:eq(1)").addClass('hong');
    };
    if(newid && tab!=3 && newid != this.utils.getCookie('newid')){
        $(".thex_hd ul>li:eq(3)").addClass('hong');
    };
    if(opnid && tab!=4 && opnid != this.utils.getCookie('opnid')){
        $(".thex_hd ul>li:eq(4)").addClass('hong');
    }
};
Wap35.prototype.setRunTime = function(time){
    if(!time && time!=0) time=60;
    var _this = this;
    if(time>=0){
        $("#btnSendCode").attr("disabled", "true");
        $("#btnSendCode").val("重获验证码"+"("+time+")");
        $("#btnSendCode").addClass("on");
        time--;
        setTimeout(function(){
            _this.setRunTime(time);
        },1000);
    }else{
        $("#btnSendCode").removeAttr("disabled"); //启用按钮
        $("#btnSendCode").removeClass("on");
        $("#btnSendCode").val("获取验证码");
    };
};
Wap35.prototype.replaceUrl = function(){
    var objs = document.getElementsByTagName("a");
    var origin = this.utils.getOrigin();
    var extend = this.utils.getUrlExtend();
    for(var i=0; i<objs.length; i++){
        var href=objs[i].getAttribute('href');
        if(href && href.indexOf('qq')=='-1' && href.indexOf('9669')=='-1' && href.indexOf('3987')=='-1' && href.indexOf('xp510')=='-1' && href.indexOf('xiaopi')=='-1' && href.indexOf('open.3500')=='-1'){
            var site = this.utils.urlSite(href);
            if(site && site != origin)
                href = href.replace(site, origin);
        };
        if(href.indexOf("?flag") == '-1' && href.indexOf("3500")!='-1' && extend['flag']) href += "?flag="+extend['flag'];
        objs[i].setAttribute('href',href);
    }
};
Wap35.prototype.contentShow = function(){
    var laytan = document.getElementById("laytan2");
    if(!laytan){
        var laytan = document.createElement("div");
        laytan.id = 'laytan2';
        laytan.className = 'laytan2';
        document.getElementsByTagName('body')[0].appendChild(laytan);
    }
    laytan.innerHTML = '<div class="laysha"><div class="erwei"><div class="container_joinin" id="container-joinin"><i class="close" id="join-close-btn"><img src="/96kaifa/statics/wap_v1/images/winclosebtn.png" alt="关闭" ></i> <div class="typeQQ"> <p class="qq"> <img src="/96kaifa/statics/wap_v1/images/qq2.png" alt=""> <span class="group-tip">官方QQ群:</span> </p> <p class="number">666967738</p> </div> <p class="boundary"> </p> <div  class="typeWX"> <P class="wx"> <img src="/96kaifa/statics/wap_v1/images/wx.png" alt=""> <span class="group-tip">官方公众号:</span> </P> <P class="identify" id="identify">长按识别下方二维码</P> <P class="QR"> <img src="/96kaifa/statics/wap_v1/images/erweima_2.jpg" alt=""> </P> </div> </div> </div> </div>';
    var close = document.getElementById('container-joinin');
    close.addEventListener('click',function(){
        laytan.style.display = 'none';
    });
    laytan.style.display = 'block';
    this.wap35ch.replace();
};
Wap35.prototype.showWeiDuan = function(){
    var flag = this.utils.getQueryString('flag');
    var _this = this;
    if((flag>20) && _this.utils.getAppType() != 'wx'){
        //this.wdshow.style.display = "none";
    }else{
        $.getJSON('/ajaxGetPisid.html',{'pisitid':8},function(res){
            if(res.status==1){
                if(_this.utils.getAppType() == 'wx'){
                    _this.wdshow.href = res['list'][1]['url'];
                    $("#weiduan").attr('data',res['list'][1]['id']);
                }else if(_this.utils.isIOS()){
                    _this.wdshow.href = res['list'][2]['url'];
                    $("#weiduan").attr('data',res['list'][2]['id']);
                }else{
                    _this.wdshow.href = res['list'][0]['url'];
                    $("#weiduan").attr('data',res['list'][0]['id']);
                }
                $("#weiduan").addClass('posited');
                $("#persondl").show();
            }
        })
    }
};
Wap35.prototype.addEventListener = function() {
    var type = arguments[0];
    var callback = arguments[1];
    var once = (arguments.length == 3 ? arguments[2] : false);
    if (!this.events[type])
        this.events[type] = [];
    this.events[type].push({
        once: once,
        callback: callback
    })
};
Wap35.prototype.dispatchEvent = function() {
    var type = arguments[0];
    var params = [];
    var i;
    if (arguments.length > 1) {
        for (i = 1; i < arguments.length; i++) {
            params.push(arguments[i])
        }
    }
    ;var list = this.events[type];
    var onces = [];
    if (list) {
        for (i = 0; i < list.length; i++) {
            var item = list[i];
            var once = item.once;
            var callback = item.callback;
            if (params.length > 0) {
                callback.apply(this, params)
            } else {
                callback.call(this)
            }
            ;if (once) {
                onces.push(i)
            }
        }
        while (onces.length > 0) {
            var index = onces.pop();
            list.splice(index, 1)
        }
    }
};
Wap35.prototype.count = function(){
    var _this = this;
    $(".playcount").live('click',function(){
        var id = $(this).attr('data');
        if(_this.utils.getCookie('playgame') == id || !id) return ;
        _this.utils.setCookie('playgame',id,60);
        $.getJSON('/api/docount.html',{id:id,name:'Playcount'},function(){});
    });

    $(".playviews").live('click',function(){
        var id = $(this).attr('data');
        if(_this.utils.getCookie('danji') == id || !id) return ;
        _this.utils.setCookie('danji',id,60);
        $.getJSON('/api/docount.html',{id:id,name:'Playviews'},function(){});
    });
    $(".posited").live('click',function(){
        var id = $(this).attr('data');
        if(_this.utils.getCookie('posit') == id || !id) return ;
        _this.utils.setCookie('posit',id,60);
        $.getJSON('/api/docount.html',{id:id,name:'Position'},function(){});
    });

};
Wap35.prototype.onFocus = function(){
    if(this.utils.getAppType() != 'wx'){
        this.openPublicMp();
    }
};
Wap35.prototype.onMall = function(){
    var url = this.utils.getOrigin() + '/userinfo/getOpenMall.html';
    this.utils.ajax(url,function(ret){
        if(ret.status ==1){
            window.location.href = ret.url;
        }
    });
};
Wap35.prototype.search = function(url){
    if(!url) url = $(".search-zoom").data('url');
    $.getJSON('/api/position.html',{'pid':9},function(res){
        if(res.code ==1){
            var word = res['data'][0]['title'];
            url += '?word='+word;
            window.location.href = url;
        }
    });
};
Wap35CH = function(wap35){
    this.wap35 = wap35;
    this.options = {};
    this.init();
};
Wap35CH.prototype.init = function(){
    var channel = this.wap35.utils.getQueryString('flag');
    var _this = this;
    if(channel){
        var url = this.wap35.utils.getOrigin() + "/api/getChannel.html?channel="+channel;
        $.getJSON(url,'',function(res){
            if(res.status ==1)
                _this.setCHData(res.data);
        });
    }
};
Wap35CH.prototype.setCHData = function(data){
    var options = {
        id:data.id,
        name:data.name,
        title:data.title,
        links:data.links,
        qq:data.qq,
        group:data.group,
        logo:data.logo,
        back:data.back,
        qrcode:data.qrcode,
        isplace:data.isplace,
    };
    this.options = options;
    this.wap35.chinfo = options;
    this.replace();
};
Wap35CH.prototype.replace = function(){
    this.wap35.replaceUrl();
    if(this.options.logo)
        $('.logo img').attr('src',this.options.logo);
    if(this.options.qq)
        $('.number').html(this.options.qq);
    if(this.options.group)
        $('.join ').attr('href',decodeURIComponent(this.options.group));
    if(this.options.qrcode){
        $(".QR img").attr('src',this.options.qrcode);
        $('.sus_hd img').attr('src',this.options.qrcode);
    }
    if(this.options.title)
        document.title = this.options.title;
};
Wap35Utils = function(wap35){
    this.wap35 = wap35;
};
Wap35Utils.prototype.extend = function(target, options) {
    if (target == undefined || target == null ) {
        return options
    } else {
        if (options) {
            for (var name in options) {
                target[name] = options[name]
            }
        }
        ;return target
    }
};
Wap35Utils.prototype.isMobile = function(){
    if(/AppleWebKit.*Mobile/i.test(navigator.userAgent)||(/MIDP|SymbianOS|NOKIA|SAMSUNG|LG|NEC|TCL|Alcatel|BIRD|DBTEL|Dopod|PHILIPS|HAIER|LENOVO|MOT-|Nokia|SonyEricsson|SIE-|Amoi|ZTE/.test(navigator.userAgent))){
        if(window.location.href.indexOf("?mobile")<0){
            try{
                if(/Android|webOS|iPhone|iPod|BlackBerry|iPad/i.test(navigator.userAgent)){
                    return true;
                }
            }catch(e){}
        }else{
            return false;
        }
    }
};
Wap35Utils.prototype.getAppType = function(){
    var ua = navigator.userAgent;
    if (/micromessenger/ig.test(ua)) {
        return "wx";
    }else if(/Safari/ig.test(ua) && /iPhone/ig.test(ua) ){
        return "ios";
    }else{
        return "other";
    }
};
Wap35Utils.prototype.isIOS = function() {
    return /iPhone|iPod|iPad|Mac/ig.test(navigator.userAgent)
};
Wap35Utils.prototype.isAndroid = function() {
    return /android|linux/i.test(navigator.userAgent)
};
Wap35Utils.prototype.getOrigin = function(){
    if (window.location.origin) {
        return window.location.origin
    } else {
        return window.location.protocol + "//" + window.location.hostname + (window.location.port ? ":" + window.location.port : "")
    }
};
Wap35Utils.prototype.urlSite = function(url){
    var site = url.match(/(?:http(?:s)?:\/\/)?(?:www\.com)?(.*?)\.com/);
    return site ? site[0] : '';
};
Wap35Utils.prototype.getUrlExtend = function(){
    var url = location.href; //获取url中"?"符后的字串
    var extend = new Object();
    if (url.indexOf("?") != -1) {
        var str = url.substr(url.indexOf("?")+1);
        strs = str.split("&");
        for(var i = 0; i < strs.length; i ++) {
            extend[strs[i].split("=")[0]]=unescape(strs[i].split("=")[1]);
        }
    }
    return extend;
};
Wap35Utils.prototype.getQueryString = function(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) return unescape(r[2]); return null;
};
Wap35Utils.prototype.setCookie = function(name,value,time){
    if(!time){
        var Days = 30;
        var exp = new Date();
        exp.setTime(exp.getTime() + Days*24*60*60*1000);
        document.cookie = name + "="+ escape (value) + ";expires=" + exp.toGMTString()  + ";path=/";
    }else{
        document.cookie = name + "="+ escape (value) + ";expires=" + time + ";path=/";
    }
};
Wap35Utils.prototype.getCookie = function(name) {
    var arr,reg=new RegExp("(^| )"+name+"=([^;]*)(;|$)");
    if(arr=document.cookie.match(reg))
        return unescape(arr[2]);
    else
        return null;
};
Wap35Utils.prototype.now =function(){
    var dt = new Date();
    dt.setMilliseconds(0);
    return dt.getTime() / 1000
};
Wap35Utils.prototype.getRandomString = function(len) {
    var base = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var str = "";
    for (var i = 0; i < len; i++) {
        var n = this.getRandomInt(1, base.length) - 1;
        str += base.substr(n, 1)
    }
    ;return str
};
Wap35Utils.prototype.getRandomInt = function(min, max) {
    return parseInt((Math.random() * (max - min + 1)) + min)
};
Wap35Utils.prototype.ajax = function() {
    var options = {
        method: "GET",
        url: "",
        data: null,
        type: "json",
        success: null,
        fail: null,
    };
    switch (arguments.length) {
        case 1:
            if (typeof arguments[0] == "string") options.url = arguments[0];
            if (typeof arguments[0] == "object") options = this.extend(options, arguments[0]);
            break;
        case 2:
            options.url = arguments[0];
            options.success = arguments[1];
            break
    };
    new Wap35UtilsAjax(this.wap35, options.method, options.url, options.data, options.type, options.success, options.fail)
};
Wap35UtilsAjax = function(wap35, method, url, data, type, success, fail) {
    this.wap35 = wap35;
    this.url = url;
    this.type = type;
    this.success = success;
    this.fail = fail;
    this.xhr = null;
    this.xhr = this.createXHR();
    var _this = this;
    this.xhr.onreadystatechange = function() {
        _this.callback.apply(_this)
    };
    if (typeof data == "object" && data != null) {
        var a = [];
        for (var p in data) {
            a.push(p + "=" + encodeURIComponent(data[p]))
        };
        data = a.join("&")
    };
    try {
        this.xhr.open(method, url, true);
        if (method.toUpperCase() == "POST") {
            this.xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8")
        };
        this.xhr.send(data)
    } catch (e) {
        console.log(url);
        console.log(e)
    }
};
Wap35UtilsAjax.prototype.createXHR = function() {
    if (window.XMLHttpRequest) {
        return new XMLHttpRequest()
    } else {
        return new ActiveXObject("Microsoft.XMLHTTP")
    }
};
Wap35UtilsAjax.prototype.callback = function() {
    if (this.xhr.readyState == 4 && this.xhr.status == 200) {
        var data = null;
        switch (this.type) {
            case "text":
                data = this.xhr.responseText;
                break;
            case "json":
                try {
                    data = JSON.parse(this.xhr.responseText)
                } catch (e) {
                    data = this.xhr.responseText
                };
                break
        };
        this.success && this.success.call(this.xhr, data)
    } else if (this.xhr.readyState == 4 && this.xhr.status != 200) {
        this.fail && this.fail.call(this.xhr)
    }
};
Wap35Wx = function(wap35){
    this.wap35 = wap35;
    this.ready = false;
    this.shareOK = null ;
    this.shareCancel = null ;
    this.init();
};
Wap35Wx.prototype.init = function(){
    var _this = this;
    this.onReady(function(){
        _this.setShareData();
    });
    _this.initJsApi();
};
Wap35Wx.prototype.initJsApi = function(){
    var timestamp = this.wap35.utils.now();
    var noncestr = this.wap35.utils.getRandomString(16);
    var url = location.href.split('#')[0];
    url = url.replace(/\&/g, '%26');
    var ajaxUrl =  this.wap35.utils.getOrigin()+ "/api/getjsapisignature.html?noncestr=" + noncestr +"&timestamp=" + timestamp + "&url=" + encodeURIComponent(url);
    var _this = this;
    this.wap35.utils.ajax(ajaxUrl,function(data){
        if(data.signature) {
            var signature = data.signature;
            wx.config({
                debug: false,
                appId: data.appid,
                timestamp: timestamp,
                nonceStr: noncestr,
                signature: signature,
                jsApiList: ["checkJsApi", "onMenuShareTimeline","onMenuShareAppMessage"]
            });
            wx.ready(function(){
                _this.ready = true;
                _this.wap35.dispatchEvent("wxReady")
            });
            wx.error(function(res) {});
        }
    });
};
Wap35Wx.prototype.onReady = function(callback) {
    if (this.ready) {
        callback && callback.call(this);
    } else {
        var _this = this;
        _this.wap35.addEventListener("wxReady", function() {
            callback && callback.call(_this)
        });
    }
};
Wap35Wx.prototype.setShareOk = function(callback){
    this.shareOK = callback;
};
Wap35Wx.prototype.setShareData = function() {
    var _this = this;
    wx.onMenuShareTimeline({
        title: _this.wap35.shareData.title,
        link: _this.wap35.shareData.link,
        imgUrl: _this.wap35.shareData.imgurl,
        success: function() {
            _this.shareOKHandler()
        },
        cancel: function() {
            _this.shareCancelHandler()
        }
    });
    wx.onMenuShareAppMessage({
        title: _this.wap35.shareData.title, // 分享标题
        desc: _this.wap35.shareData.desc, // 分享描述
        link: _this.wap35.shareData.link, // 分享链接，该链接域名需在JS安全域名中进行登记
        imgUrl: _this.wap35.shareData.imgurl, // 分享图标
        success: function () {
            _this.shareOKHandler()
            // 用户确认分享后执行的回调函数
        },
        cancel: function () {
            _this.shareCancelHandler()
            // 用户取消分享后执行的回调函数
        }
    });
};
Wap35Wx.prototype.shareOKHandler = function(){
    this.shareOK && this.shareOK.call(null);
};
Wap35Wx.prototype.shareCancelHandler = function(){
    this.shareCancel && this.shareCancel.apply(this.wap35);
};


