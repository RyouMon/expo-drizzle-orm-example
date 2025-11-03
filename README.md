# React Native 使用 ORM 的示例 (通过 Expo + Drizzle 实现)

# 直接运行示例
1. 克隆代码仓

2. 安装依赖
```
npm install
```

3. 运行项目
```
npm run ios|android
```

# 从头搭建项目
## 初始化项目

1. 创建项目
```bash
npx create-expo-app@latest expo-drizzle-orm
```

2. 删除示例代码
```bash
npm run reset-project
```

3. 安装依赖
```bash
npx expo install expo-sqlite

npm i -D drizzle-kit
npm i drizzle-orm babel-plugin-inline-import
npm i expo-drizzle-studio-plugin
```

## 配置Drizzle

1. 创建 `drizzle.config.ts` 配置文件
```ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: './db/schema.ts',
	out: './drizzle',
    dialect: 'sqlite',
	driver: 'expo', // <--- very important
});
```

2. 创建`babel`和`metro`配置文件
```bash
npx expo customize metro.config.js
npx expo customize babel.config.js
```

3. 编辑 `babel.config.js`
```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [["inline-import", { "extensions": [".sql"] }]] // <-- add this
  };
};
```

4. 编辑 `metro.config.js`
```js
// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('sql'); // <--- add this

module.exports = config;
```

## 编写 Schema

1. 新建文件夹和文件：`db/schema.ts`
```ts
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull()
});

// Export Task to use as an interface in your app
export type Task = typeof tasks.$inferSelect;
```

2. 生成迁移文件
```bash
npx drizzle-kit generate
```

## 使用Drizzle
1. 连接数据库并进行迁移，编辑`app/_layout.tsx`:
```tsx
import migrations from '@/drizzle/migrations';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { Stack } from 'expo-router';
import { SQLiteProvider, openDatabaseSync } from 'expo-sqlite';
import { Suspense } from 'react';
import { ActivityIndicator } from 'react-native';

export const DATABASE_NAME = 'tasks';

export default function RootLayout() {
  const expoDb = openDatabaseSync(DATABASE_NAME);
  const db = drizzle(expoDb);
  const { success, error } = useMigrations(db, migrations);

  console.log('success', success)
  console.log('error', error)

  return (
    <Suspense fallback={<ActivityIndicator size="large" />}>
      <SQLiteProvider
        databaseName={DATABASE_NAME}
        options={{ enableChangeListener: true }}
        useSuspense>
        <Stack>
          <Stack.Screen name="index" options={{ title: 'Tasks' }} />
        </Stack>
      </SQLiteProvider>
    </Suspense>
  );
}
```

2. 插入数据到数据库并实时显示，编辑`app/index.tsx`:
```tsx
import * as schema from '@/db/schema';
import { drizzle, useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useSQLiteContext } from 'expo-sqlite';
import { Button, FlatList, Text, View } from 'react-native';

export const DATABASE_NAME = 'tasks';

export default function Index() {
  const db = useSQLiteContext();
  const drizzleDb = drizzle(db, { schema });

  const { data } = useLiveQuery(
    drizzleDb.select().from(schema.tasks)
  );

  async function insertTask() {
    await drizzleDb.insert(schema.tasks).values({
      name: `Task ${Math.floor(Math.random() * 1000)}`,
    });
    console.log('Task inserted')
  }

  return (
    <View>
      <Button
        title="Insert Task"
        onPress={insertTask}
      />
      <FlatList 
        data={data}
        renderItem={({ item }) => <Text>{JSON.stringify(item)}</Text>}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  )
}
```

3. 运行项目
```
npm run ios|android
```

# 参考
- https://expo.dev/blog/modern-sqlite-for-react-native-apps
- https://orm.drizzle.team/docs/connect-expo-sqlite