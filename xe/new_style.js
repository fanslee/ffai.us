$(document).ready(function(){	
	if($(".mySwiper").length>0){
        var mySwiper = new Swiper ('.mySwiper', {
            direction: 'horizontal',
            autoplay : 5000,
            autoplayDisableOnInteraction : false,
            loop: true,
            // 如果需要分页器
            pagination:'.swiper-pagination' ,
            paginationClickable: true
        });
    }
    if($(".wgSwiper").length>0){
        var wgSwiper = new Swiper('.wgSwiper', {
	        // pagination: '.swiper-pagination',
	        slidesPerView: 'auto',
	        paginationClickable: true
	    });
    }
});

/* 浮动置顶 */
$(document).ready(function () {
	if($(".subnav").size()>0){
		var $fixedNav = $(".subnav .nav-in");
		var navTop = $fixedNav.offset().top + $fixedNav.height();
		$(window).on("scroll", function () {
			var wt = $(this).scrollTop();
			if (wt > navTop) {
				$fixedNav.addClass('nav-fixed');
			} else {
				$fixedNav.removeClass('nav-fixed');
			}
		});
	}
	if($("#gametop").size()>0){
		var $fixedGame = $("#gametop");
		var gameTop = $fixedGame.offset().top + $fixedGame.height();
		$(window).on("scroll", function () {
			var wt2 = $(this).scrollTop();
			if (wt2 > gameTop) {
				$fixedGame.addClass('game_fixed');
			} else {
				$fixedGame.removeClass('game_fixed');
			}
		});
	}
});

$(document).ready(function(){
    $("#game_tab li").click(function(){
		$("#game_tab li").removeClass("curr");
		$(this).addClass("curr");
	});
	$("#game_tab li:eq(0)").click(function(){
		$("#game_down_show").children().show();
	});
	$("#tab_libao").click(function(){
		$("#game_libao").show().prevAll().hide();
		$("#game_libao").nextAll().show();
		$(this).find("i").remove();
	});
	$("#tab_zixun").click(function(){
		$("#game_zixun").show().prevAll().hide();
		$("#game_zixun").nextAll().show();
		$(this).find("i").remove();
	});
	$("#tab_cmt").click(function(){
		$("#game_cmt").show().prevAll().hide();
		$("#game_cmt").nextAll().show();
	});
    $(".qqun,.qqgroup").click(function(){
        window.location.href='https://jq.qq.com/?_wv=1027&k=43d87Sf';
    })
});

$(window).resize(function(){
	$('.laysha').css("height", window.innerHeight + "px")
})

//选项卡切换
function setTab(name,cursel,n){
	for(i=1;i<=n;i++){
	var menu=document.getElementById(name+i);
	var con=document.getElementById("con_"+name+"_"+i);
	menu.className=i==cursel?"curr":"";
	con.style.display=i==cursel?"block":"none";
	}
}
//选项卡切换2
function onSelect(obj,ch){
	$(obj).removeClass("t");
	var parentNodeObj= obj.parentNode;
	var s=0;
	for(i=0;i<parentNodeObj.childNodes.length;i++){
		// alert("第" +i +"次")
		if (parentNodeObj.childNodes[i].nodeName=="#text"){
			continue;
		}
		parentNodeObj.childNodes[i].className="tab_1";
		var newObj=document.getElementById(ch + "_" + s);
		if(newObj!=null){
			newObj.style.display='none';
			if(parentNodeObj.childNodes[i]==obj){
				newObj.style.display='';
			}
		}
		s +=1;
	}
	obj.className="tab_2";
 }

tyMap = window.tyMap || {};
function tyViaJs(locationId) {
    var _f = undefined;
    var _fconv = 'tyMap[\"' + locationId + '\"]';
    try {
        _f = eval(_fconv);
        if (_f != undefined) {
            _f()
        }
    } catch(e) {}
}
function tyLoader(closetag) {
    var tyTest = null,
        tyTestPos = document.getElementsByTagName("span");
    for (var i = 0; i < tyTestPos.length; i++) {
        if (tyTestPos[i].className == "tyTestPos") {
            tyTest = tyTestPos[i];
            break
        }
    }
    if (tyTest == null) return;
    if (!closetag) {
        document.write("<span id=tyTestPos_" + tyTest.id + " style=display:none>");
        tyViaJs(tyTest.id);
        return
    }
    document.write("</span>");
    var real = document.getElementById("tyTestPos_" + tyTest.id);
    for (var i = 0; i < real.childNodes.length; i++) {
        var node = real.childNodes[i];
        if (node.tagName == "SCRIPT" && /closetag/.test(node.className)) continue;
        tyTest.parentNode.insertBefore(node, tyTest);
        i--
    }
    tyTest.parentNode.removeChild(tyTest);
    real.parentNode.removeChild(real)
}

tyMap['1'] = function() {
    document.writeln("<a href=\"http://a.app.qq.com/o/simple.jsp?pkgname=com.xunrui.h5game\" class=\"posited\" data=\"48\"><img src=\"/uploadfile/2017/1024/20171024135724.gif\" ></a>")
}

