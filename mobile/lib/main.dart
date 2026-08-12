import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'controller.dart';
import 'screens/auth_screens.dart';
import 'screens/home_shell.dart';
import 'screens/list_screens.dart';
import 'screens/more_screens.dart';
import 'theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final controller = GivyController();
  await controller.init();
  runApp(GivyApp(controller: controller));
}

class GivyApp extends StatelessWidget {
  const GivyApp({super.key, required this.controller});

  final GivyController controller;

  @override
  Widget build(BuildContext context) {
    final router = GoRouter(
      initialLocation: controller.user == null ? '/' : '/app',
      routes: [
        GoRoute(path: '/', builder: (context, state) => const LandingScreen()),
        GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
        GoRoute(
          path: '/app',
          builder: (context, state) => const AppShell(index: 0, child: HomeScreen()),
        ),
        GoRoute(
          path: '/app/lists',
          builder: (context, state) => const AppShell(index: 1, child: ListsScreen()),
        ),
        GoRoute(
          path: '/app/create',
          builder: (context, state) => const AppShell(index: 2, child: CreateScreen()),
        ),
        GoRoute(
          path: '/app/giveaways',
          builder: (context, state) => const AppShell(index: 3, child: GiveawaysScreen()),
        ),
        GoRoute(
          path: '/app/profile',
          builder: (context, state) => const AppShell(index: 4, child: ProfileScreen()),
        ),
        GoRoute(
          path: '/app/activity',
          builder: (context, state) => const ActivityScreen(),
        ),
        GoRoute(
          path: '/app/list/:id',
          builder: (context, state) => ListDetailScreen(listId: state.pathParameters['id']!),
        ),
        GoRoute(
          path: '/g/:code',
          builder: (context, state) => SharedScreen(code: state.pathParameters['code']!),
        ),
      ],
    );

    return ChangeNotifierProvider.value(
      value: controller,
      child: MaterialApp.router(
        title: 'Givy',
        debugShowCheckedModeBanner: false,
        theme: buildGivyTheme(),
        routerConfig: router,
      ),
    );
  }
}
