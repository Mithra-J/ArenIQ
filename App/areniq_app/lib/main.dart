import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(
    url: 'abc',       // Replace with your Supabase project URL
    anonKey: 'abc';

  runApp(const ArenIQApp());
}

// Supabase client shortcut — use this anywhere in the app
final supabase = Supabase.instance.client;

class ArenIQApp extends StatelessWidget {
  const ArenIQApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ArenIQ',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF1565C0), // Deep blue — water theme
        ),
        useMaterial3: true,
      ),
      // Show home if already logged in, otherwise show login
      home: supabase.auth.currentSession != null
          ? const HomeScreen()
          : const LoginScreen(),
    );
  }
}