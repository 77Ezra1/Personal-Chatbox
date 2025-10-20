# formatInTimezone 时间格式化工具

## 📋 功能概述

`formatInTimezone` 是一个统一的时间格式化工具，用于将任何日期/时间转换为标准格式：`YYYY-MM-DD HH:mm:ss`

## 🎯 核心功能

### 1. formatInTimezone(date, timezone)

将日期格式化为指定时区的统一格式。

#### 参数：
- `date`: Date 对象、ISO 字符串、或时间戳（毫秒）
- `timezone`: IANA 时区名称（默认：'Asia/Shanghai'）

#### 返回值：
- 格式化的字符串：`YYYY-MM-DD HH:mm:ss`

#### 示例：

```javascript
import { formatInTimezone } from '@/lib/utils';

// 使用 Date 对象
formatInTimezone(new Date(), 'Asia/Shanghai')
// => '2025-10-19 14:30:45'

// 使用 ISO 字符串
formatInTimezone('2025-10-19T06:30:45Z', 'America/New_York')
// => '2025-10-19 02:30:45'

// 使用时间戳
formatInTimezone(1729334445000, 'UTC')
// => '2025-10-19 06:30:45'

// 使用默认时区（Asia/Shanghai）
formatInTimezone(new Date())
// => '2025-10-19 14:30:45'
```

### 2. formatNowInTimezone(timezone)

获取当前时间的格式化字符串。

#### 示例：

```javascript
import { formatNowInTimezone } from '@/lib/utils';

// 获取当前时间（UTC）
formatNowInTimezone('UTC')
// => '2025-10-19 06:30:45'

// 获取当前时间（默认时区）
formatNowInTimezone()
// => '2025-10-19 14:30:45'
```

### 3. getCommonTimezones()

获取常用时区列表。

#### 返回值：

```javascript
[
  { value: 'Asia/Shanghai', label: 'China Standard Time (CST)', offset: 'UTC+8' },
  { value: 'UTC', label: 'Coordinated Universal Time (UTC)', offset: 'UTC+0' },
  { value: 'America/New_York', label: 'Eastern Time (ET)', offset: 'UTC-5/-4' },
  // ... 更多时区
]
```

#### 示例：

```javascript
import { getCommonTimezones } from '@/lib/utils';

const timezones = getCommonTimezones();

// 在 UI 中使用
<select>
  {timezones.map(tz => (
    <option key={tz.value} value={tz.value}>
      {tz.label} ({tz.offset})
    </option>
  ))}
</select>
```

## 💡 使用场景

### 1. 笔记创建/更新时间

```javascript
import { formatInTimezone } from '@/lib/utils';

// 在创建笔记时
const note = {
  title: 'My Note',
  content: 'Note content',
  created_at: formatInTimezone(new Date(), 'Asia/Shanghai'),
  updated_at: formatInTimezone(new Date(), 'Asia/Shanghai')
};

console.log(note.created_at); // => '2025-10-19 14:30:45'
```

### 2. 显示用户本地时间

```javascript
import { formatInTimezone } from '@/lib/utils';

// 从服务器获取 UTC 时间，转换为用户时区
const serverTime = '2025-10-19T06:30:45Z';
const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const localTime = formatInTimezone(serverTime, userTimezone);

console.log(localTime); // 根据用户时区显示
```

### 3. 日志记录

```javascript
import { formatNowInTimezone } from '@/lib/utils';

console.log(`[${formatNowInTimezone('UTC')}] User logged in`);
// => [2025-10-19 06:30:45] User logged in
```

### 4. 时区选择器

```javascript
import { getCommonTimezones, formatInTimezone } from '@/lib/utils';

function TimezoneConverter() {
  const [timezone, setTimezone] = useState('UTC');
  const timezones = getCommonTimezones();
  
  return (
    <div>
      <select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
        {timezones.map(tz => (
          <option key={tz.value} value={tz.value}>
            {tz.label}
          </option>
        ))}
      </select>
      
      <p>Current time: {formatNowInTimezone(timezone)}</p>
    </div>
  );
}
```

## 🎨 完整示例

### React 组件中使用

```javascript
import React, { useState, useEffect } from 'react';
import { formatInTimezone, formatNowInTimezone, getCommonTimezones } from '@/lib/utils';

function TimeDisplay() {
  const [currentTime, setCurrentTime] = useState('');
  const [selectedTimezone, setSelectedTimezone] = useState('Asia/Shanghai');
  const timezones = getCommonTimezones();

  useEffect(() => {
    // 每秒更新时间
    const timer = setInterval(() => {
      setCurrentTime(formatNowInTimezone(selectedTimezone));
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedTimezone]);

  return (
    <div className="time-display">
      <h2>World Clock</h2>
      
      <select 
        value={selectedTimezone} 
        onChange={(e) => setSelectedTimezone(e.target.value)}
      >
        {timezones.map(tz => (
          <option key={tz.value} value={tz.value}>
            {tz.label} ({tz.offset})
          </option>
        ))}
      </select>

      <div className="current-time">
        {currentTime}
      </div>
    </div>
  );
}

export default TimeDisplay;
```

### 笔记时间戳

```javascript
import { formatInTimezone } from '@/lib/utils';

// 在 NoteEditor 组件中
const handleSave = async () => {
  const noteData = {
    title,
    content,
    category,
    tags,
    created_at: formatInTimezone(new Date(), 'Asia/Shanghai'),
    updated_at: formatInTimezone(new Date(), 'Asia/Shanghai')
  };

  await saveNote(noteData);
};
```

## ⚙️ 技术细节

### 支持的输入类型

1. **Date 对象**
   ```javascript
   formatInTimezone(new Date(), 'UTC')
   ```

2. **ISO 字符串**
   ```javascript
   formatInTimezone('2025-10-19T06:30:45Z', 'UTC')
   ```

3. **时间戳（毫秒）**
   ```javascript
   formatInTimezone(1729334445000, 'UTC')
   ```

4. **无效输入**
   ```javascript
   formatInTimezone('invalid', 'UTC')
   // => 'Invalid Date'
   ```

### 时区格式

使用 IANA 时区数据库格式：
- ✅ `'Asia/Shanghai'`
- ✅ `'America/New_York'`
- ✅ `'Europe/London'`
- ✅ `'UTC'`
- ❌ `'CST'` (不推荐使用缩写)
- ❌ `'GMT+8'` (不推荐使用偏移量)

### 输出格式

固定格式：`YYYY-MM-DD HH:mm:ss`

特点：
- ✅ 24 小时制
- ✅ 所有数字都有前导零（01-09）
- ✅ 使用连字符和冒号分隔
- ✅ 易于排序和比较

## 🔧 错误处理

```javascript
// 无效日期
formatInTimezone('not a date', 'UTC')
// => 'Invalid Date'

// 无效时区（会回退到默认行为）
formatInTimezone(new Date(), 'Invalid/Timezone')
// => 可能抛出错误或使用 UTC

// null/undefined（使用当前时间）
formatInTimezone(null, 'UTC')
// => 当前时间的 UTC 格式
```

## 📝 测试

运行测试：

```bash
npm test src/lib/__tests__/utils.formatInTimezone.test.js
```

测试覆盖：
- ✅ Date 对象格式化
- ✅ ISO 字符串格式化
- ✅ 时间戳格式化
- ✅ 不同时区转换
- ✅ 无效输入处理
- ✅ 边界情况（午夜、单数字）
- ✅ 当前时间格式化
- ✅ 时区列表获取

## 🚀 性能

- 使用原生 `Intl.DateTimeFormat` API，性能优秀
- 无需外部依赖库（如 moment.js、date-fns）
- 适合频繁调用（如实时时钟）

## 📚 相关资源

- [IANA 时区数据库](https://www.iana.org/time-zones)
- [MDN: Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
- [时区列表](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)

## 🎯 下一步

可以考虑添加：
- [ ] 相对时间格式（"2 小时前"）
- [ ] 自定义格式模板
- [ ] 时区自动检测
- [ ] 日期范围格式化
- [ ] 多语言支持
