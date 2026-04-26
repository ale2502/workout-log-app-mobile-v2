import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Exercise = {
  id: number;
  name: string;
  muscleGroup: string;
};

export default function HomeScreen() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadExercises() {
      try {
        const response = await fetch('http://localhost:3001/exercises');

        if (!response.ok) {
          throw new Error('Failed to load exercises');
        }

        const data = await response.json();
        setExercises(data);
      } catch (error) {
        setError('Could not load exercises');
      } finally {
        setIsLoading(false);
      }
    }
    loadExercises();
  }, []);

  const muscleGroups = [
    ...new Set(exercises.map((exercise) => exercise.muscleGroup)),
  ];

  const filteredExercises = selectedMuscleGroup
    ? exercises.filter(
        (exercise) => exercise.muscleGroup === selectedMuscleGroup,
      )
    : [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Workout Log</Text>

      <Pressable style={styles.startButton}>
        <Text style={styles.startButtonText}>Start Workout</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Choose muscle group</Text>

      {isLoading && <Text>Loading exercises...</Text>}

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.muscleGroupList}>
        {muscleGroups.map((muscleGroup) => (
          <Pressable
            key={muscleGroup}
            style={[
              styles.muscleGroupButton,
              selectedMuscleGroup === muscleGroup &&
                styles.selectedMuscleGroupButton,
            ]}
            onPress={() => setSelectedMuscleGroup(muscleGroup)}
          >
            <Text>{muscleGroup}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Exercises</Text>

      {filteredExercises.map((exercise) => (
        <Text key={exercise.id} style={styles.exerciseName}>
          {exercise.name}
        </Text>
      ))}
    </View>
  );
}

// import { Image } from 'expo-image';
// import { Platform, StyleSheet } from 'react-native';

// import { HelloWave } from '@/components/hello-wave';
// import ParallaxScrollView from '@/components/parallax-scroll-view';
// import { ThemedText } from '@/components/themed-text';
// import { ThemedView } from '@/components/themed-view';
// import { Link } from 'expo-router';

// export default function HomeScreen() {
//   return (
//     <ParallaxScrollView
//       headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
//       headerImage={
//         <Image
//           source={require('@/assets/images/partial-react-logo.png')}
//           style={styles.reactLogo}
//         />
//       }>
//       <ThemedView style={styles.titleContainer}>
//         <ThemedText type="title">Welcome!</ThemedText>
//         <HelloWave />
//       </ThemedView>
//       <ThemedView style={styles.stepContainer}>
//         <ThemedText type="subtitle">Step 1: Try it</ThemedText>
//         <ThemedText>
//           Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes.
//           Press{' '}
//           <ThemedText type="defaultSemiBold">
//             {Platform.select({
//               ios: 'cmd + d',
//               android: 'cmd + m',
//               web: 'F12',
//             })}
//           </ThemedText>{' '}
//           to open developer tools.
//         </ThemedText>
//       </ThemedView>
//       <ThemedView style={styles.stepContainer}>
//         <Link href="/modal">
//           <Link.Trigger>
//             <ThemedText type="subtitle">Step 2: Explore</ThemedText>
//           </Link.Trigger>
//           <Link.Preview />
//           <Link.Menu>
//             <Link.MenuAction title="Action" icon="cube" onPress={() => alert('Action pressed')} />
//             <Link.MenuAction
//               title="Share"
//               icon="square.and.arrow.up"
//               onPress={() => alert('Share pressed')}
//             />
//             <Link.Menu title="More" icon="ellipsis">
//               <Link.MenuAction
//                 title="Delete"
//                 icon="trash"
//                 destructive
//                 onPress={() => alert('Delete pressed')}
//               />
//             </Link.Menu>
//           </Link.Menu>
//         </Link>

//         <ThemedText>
//           {`Tap the Explore tab to learn more about what's included in this starter app.`}
//         </ThemedText>
//       </ThemedView>
//       <ThemedView style={styles.stepContainer}>
//         <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
//         <ThemedText>
//           {`When you're ready, run `}
//           <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
//           <ThemedText type="defaultSemiBold">app</ThemedText> directory. This will move the current{' '}
//           <ThemedText type="defaultSemiBold">app</ThemedText> to{' '}
//           <ThemedText type="defaultSemiBold">app-example</ThemedText>.
//         </ThemedText>
//       </ThemedView>
//     </ParallaxScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   titleContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   stepContainer: {
//     gap: 8,
//     marginBottom: 8,
//   },
//   reactLogo: {
//     height: 178,
//     width: 290,
//     bottom: 0,
//     left: 0,
//     position: 'absolute',
//   },
// });
