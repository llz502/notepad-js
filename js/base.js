;(function(){
    'use strict';
    var $form_add_task = $('.add-task')
      , $task_delete_trigger
      , $task_detail_trigger
      , $task_detail_mask = $('.task-detail-mask')
      , $task_detail = $('.task-detail')
      , task_list = []
      , current_index
      , $update_form
      , $task_detail_content
      , $task_detail_content_input
      , $checkbox_complete
      ;

    init();

    // console.log('$task_detail',$task_detail);
    $form_add_task.on('submit',on_add_task_form_submit);
    $task_detail_mask.on('click',hide_task_detail);


    function on_add_task_form_submit(e){
        //每次submit时间，都会生成一个新的函数作用域，里面的变量也是独立作用域里的新的变量，同样的变量名却是不同的变量
        var new_task = {},$input;
        // 禁用默认行为
        e.preventDefault();
        // 获取新Task的input[name=content]的输入框的值
        $input = $(this).find('input[name=content]');
        new_task.content = $input.val();
        // 如果新Task的值为空，则直接返回，否则继续执行
        if(!new_task.content) return;
        // 存入新的Task
        if(add_task(new_task)){
            $input.val(null);
        }
    }

    // 清空任务列表，并对任务列表重新渲染模板
    function render_task_list(){
        var $task_list = $('.task-list');
        $task_list.html('');
        var complete_items = [];
        for(var i = 0;i<task_list.length;i++){
            var item = task_list[i];
            if (item && item.complete){
                complete_items[i] = item;
            } else {
              // {'content',input[type=text].val()}
                 var task = render_task_item(item,i);
            }
            $task_list.prepend(task);
        }
        
        for (var j = 0;j < complete_items.length; j++){
            var complete_item =  complete_items[j]
            var $task = $(render_task_item(complete_item,j));

            if(!$task) continue;
            $task.addClass("completed");
            
            $task_list.append($task);
        }
       
       $task_delete_trigger = $('.action.delete');
       $task_detail_trigger = $('.action.detail');
       $checkbox_complete = $('.task-list .complete[type=checkbox]');
       listen_task_delete();
       listen_task_detail();
       listen_checkbox_complete();
    }
    //创建单个DOM任务项元素
    function render_task_item(data,index){
        if(!data || index === undefined) return;
        var list_item_tpl = 
        '<div class="task-item" data-index="' + index + '">'+
        '<span><input class="complete" ' + (data.complete ? 'checked' : '') + ' type="checkbox"></span>'+
        '<span class="task-content">' + data.content + '</span>'+
        '<span class="fr">' +
        '<span class="action delete"> 删除 </span>'+
        '<span class="action detail"> 详情 </span>'+
        '</span>'
        '</div>';
        // 使用jQuery生成模板的DOM元素实例
       
        // ['0':'div',length:1]
        return $(list_item_tpl)['0'];
    }
    // 初始化，
    function init(){
        store.clear();
        if(!store.enabled){
            alert("你的浏览器不支持本地存储，请使用更高版本的浏览器");
            return;
        }
        task_list = store.get('task_list') || [];
        if(task_list.length){
            render_task_list();
            
        }
    }

    function task_remind_check(){
        var current_timestamp;
        var itl = setInterval(function(){
            for(var i = 0;i < task_list.length; i++){
                var item = get(i),task_timestamp;
                if(!item && !item.remind_date) continue;

                current_timestamp = (new Date()).getTime();
                task_timestamp = (new Date(item.remind_date)).getTime();
                if(current_timestamp - task_timestamp >= 1){
                    notify(item.content);
                }
            }
        },  300);
    }

    function notify(){
        
    }
    // 监听详情按钮的点击事件,改变详情页的display
    function listen_task_detail(){
        $task_detail_trigger.on('click',function(){
            var $this = $(this);
            var $item = $this.parent().parent();
            var index = $item.data('index');
            show_task_detail(index);
        });
    }
    // 监听打钩完成事件，更新store和task-list
    function listen_checkbox_complete(){
        $checkbox_complete.on('click',function(){
            var $this = $(this);
            // var is_complete = $this.is(':checked');
            var index = $this.parent().parent().data('index');
            var item = get(index);
            if (item.complete){
                update_task(index,{complete:false});
            } else {
                update_task(index,{complete:true});
            }
        });
    }
    // 获取store里属性是task_list的数组
    function get(index){
        return store.get('task_list')[index];
    }
    // 显示详情内容和遮罩
    function show_task_detail(index){
        render_task_detail(index);
        current_index = index;
        $task_detail.show();
        $task_detail_mask.show();
    }
    // 隐藏详情内容和遮罩
    function hide_task_detail(){
        $task_detail.hide();
        $task_detail_mask.hide();
    }
    // 更新详细内容
    function update_task(index,data){
        if(index === undefined || !task_list[index]) return;
        task_list[index] = $.extend({},task_list[index],data);
        refresh_task_list();
    }
    //渲染指定Task的详细信息
    function render_task_detail(index){
        if (index === undefined || !task_list[index]) return;

        var item = task_list[index]
        var tpl = 
        '<form>'+
        '<div class="content">'+
        item.content +
        '</div>'+
        '<div>' + 
        '<input style="display:none;" type="text" name="content" value="' + item.content + '">' + 
        '</div>' +
        '<div>'+
        '<div class="desc">'+
        '    <textarea name="desc" >' + (item.desc || '')+ '</textarea>'+
        '</div>'+
        '</div>'+
        '<div class="remind input-item">'+
        '    <label>提醒时间</label>' +
        '    <input class="datetime" name="remind_date" type="text" value="' +(item.remind_date || '') + '">' +
        '</div>'+
            '<div class="input-item"><button type="submit">更新</button></div>'+
        '</form>';
        // 更新模板实例的数据
        $task_detail.html(null);
        $task_detail.html(tpl);
        $('.datetime').datetimepicker();
        // 选中form元素
        $update_form = $task_detail.find('form');
        // 选中详情表单的标题内容
        $task_detail_content = $update_form.find('.content');
        // 选中详情表单的中部内容区
        $task_detail_content_input = $update_form.find('[name=content]');


        $task_detail_content.on('dblclick',function(){
            $task_detail_content.hide();
            $task_detail_content_input.show();
        });

        $update_form.on('submit',function(e){
            // 回调函数触发后，表单就会马上提交，所以取消默认事件
            e.preventDefault();
            var data = {};
            data.content = $(this).find('[name=content]').val();
            data.desc = $(this).find('[name=desc]').val();
            data.remind_date = $(this).find('[name=remind_date]').val();
            update_task(index,data);
            // console.log('data',data);
            $task_detail.hide();
        })
    }

    //监听删除按钮的点击事件
    function listen_task_delete(){
    $task_delete_trigger.on('click',function(){
        var $this = $(this);
        var $item = $this.parent().parent();
        var index = $item.data('index');
        var tmp = confirm('确定删除？')
        tmp ? delete_task(index) : null;
    })
        
    }
    // 更新task_list,渲染task_list任务列表
    function refresh_task_list(){
        store.set('task_list',task_list);
        render_task_list();
    }
    // 添加新任务
    function add_task(new_task){
        // 将新Task推入task_list,['0':{'content',input[type=text].val()}]
        task_list.push(new_task);
        refresh_task_list();
        return true;
    }
    //删除任务
    function delete_task(index){
        
        if(index === undefined || !task_list[index]) return;
        delete task_list[index];
        refresh_task_list();
    }

    // store.remove(task_list);
})();