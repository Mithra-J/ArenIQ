import 'package:flutter_test/flutter_test.dart';
import 'package:areniq_app/main.dart';

void main() {
  testWidgets('ArenIQ app smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const ArenIQApp());
    expect(find.text('ArenIQ'), findsOneWidget);
  });
}