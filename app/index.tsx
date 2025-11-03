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
