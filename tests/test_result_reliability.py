"""Result eligibility tests. OCR is stubbed; profile/label fixtures are synthetic."""
import unittest
import test_stabilization as fixtures


class ResultReliabilityTests(unittest.TestCase):
    setUpClass = classmethod(fixtures.StabilizationTests.setUpClass.__func__)
    tearDownClass = classmethod(fixtures.StabilizationTests.tearDownClass.__func__)
    setUp = fixtures.StabilizationTests.setUp
    tearDown = fixtures.StabilizationTests.tearDown
    fresh = fixtures.StabilizationTests.fresh
    seeded = fixtures.StabilizationTests.seeded

    def camera(self, pg, data):
        pg.evaluate("""async data=>{
          window.Tesseract={recognize:async()=>({data})};
          openScanModal();document.getElementById('canvas').width=1;
          await onProcessScanClick();
        }""", data)

    def upload(self, pg, data):
        pg.evaluate("""async data=>{
          window.Tesseract={recognize:async()=>({data})};openScanModal();
          await processImage(new Blob(['synthetic image'],{type:'image/png'}));
        }""", data)

    def assert_unable(self, pg, selector='#scanResults'):
        text = pg.locator(selector).inner_text()
        self.assertIn('Unable to assess', text)
        self.assertNotIn('No listed conflicts detected', text)
        self.assertNotIn('No intolerances found', text)
        self.assertNotIn('appear to be safe', text)
        self.assertNotIn('appears to be safe', text)
        # A reason plus a concrete next step accompanies the heading.
        self.assertGreaterEqual(pg.locator(selector+' [role=status] p').count(), 2)

    def test_camera_rejects_empty_numeric_and_unusable_text(self):
        pg = self.seeded()
        for text in ['', '   ', '12345 !!!', ', ; () []', 'the, and, for']:
            with self.subTest(text=text):
                self.camera(pg, {'text': text, 'confidence': 95})
                self.assert_unable(pg)
                self.assertTrue(pg.locator('#scanStatus [role=status]').is_visible())
                self.assertFalse(pg.evaluate('processingScan'))

    def test_upload_rejects_empty_numeric_and_unusable_text(self):
        pg = self.seeded()
        for text in ['', '   ', '12345 !!!', ', ; () []']:
            with self.subTest(text=text):
                self.upload(pg, {'text': text, 'confidence': 95})
                self.assert_unable(pg)
                self.assertTrue(pg.locator('#scanStatus [role=status]').is_visible())
                self.assertFalse(pg.evaluate('isProcessing'))

    def test_ocr_uncertainty_blocks_camera_and_upload(self):
        pg = self.seeded()
        for data in [{'text': 'sugar, salt'}, {'text': 'sugar, salt', 'confidence': None},
                     {'text': 'sugar, salt', 'confidence': '95'},
                     {'text': 'sugar, salt', 'confidence': -1},
                     {'text': 'sugar, salt', 'confidence': 49.9},
                     {'text': 'sugar, salt', 'confidence': 101}]:
            for path in [self.camera, self.upload]:
                with self.subTest(data=data, path=path.__name__):
                    path(pg, data)
                    self.assert_unable(pg)

    def test_no_profile_empty_profile_and_invalid_profile_block_results(self):
        pg = self.seeded()
        for mutation in ["delete intolerances[currentPet]", "intolerances[currentPet]=[]",
                         "intolerances[currentPet]=[null,123,'   ']",
                         "intolerances[currentPet]=['milk',null]",
                         "intolerances[currentPet]=['12345']"]:
            with self.subTest(mutation=mutation):
                pg.evaluate(mutation)
                self.camera(pg, {'text': 'sugar, salt', 'confidence': 95})
                self.assert_unable(pg)
                self.assertIn('profile', pg.locator('#scanResults').inner_text())
                self.upload(pg, {'text': 'sugar, salt', 'confidence': 95})
                self.assert_unable(pg)
                pg.evaluate("scanIngredients('sugar, salt')")
                self.assert_unable(pg)

    def test_missing_image_replaces_previous_result_and_resets_busy_state(self):
        pg = self.seeded()
        self.camera(pg, {'text': 'sugar, salt', 'confidence': 95})
        pg.evaluate('openScanModal(); onProcessScanClick()')
        self.assert_unable(pg)
        self.assertIn('No image', pg.locator('#scanResults').inner_text())
        self.assertFalse(pg.evaluate('processingScan'))

    def test_ocr_rejections_and_synchronous_failures_have_visible_recovery(self):
        pg = self.seeded()
        for synchronous in [True, False]:
            with self.subTest(synchronous=synchronous):
                pg.evaluate("""async synchronous=>{
                  window.Tesseract={recognize:()=>{if(synchronous)throw new Error('synthetic failure');
                    return Promise.reject(new Error('synthetic failure'))}};
                  openScanModal();document.getElementById('canvas').width=1;await onProcessScanClick();
                }""", synchronous)
                self.assert_unable(pg)
                pg.evaluate("processImage(new Blob(['synthetic']))")
                self.assert_unable(pg)
                self.assertFalse(pg.evaluate('isProcessing'))

    def test_failed_rescan_replaces_old_result_and_next_success_recovers(self):
        pg = self.seeded()
        for path in [self.camera, self.upload]:
            path(pg, {'text': 'sugar, salt', 'confidence': 95})
            self.assertIn('No listed conflicts detected', pg.locator('#scanResults').inner_text())
            path(pg, {'text': '12345', 'confidence': 95})
            self.assert_unable(pg)
            path(pg, {'text': 'milk, salt', 'confidence': 95})
            self.assertNotIn('Unable to assess', pg.locator('#scanResults').inner_text())
            self.assertIn('Found 1 intolerance', pg.locator('#scanResults').inner_text())

    def test_valid_no_match_is_qualified_not_a_safety_promise(self):
        pg = self.seeded()
        for path in [self.camera, self.upload]:
            path(pg, {'text': 'sugar, salt', 'confidence': 50})
            text = pg.locator('#scanResults').inner_text()
            self.assertIn('No listed conflicts detected', text)
            self.assertIn('does not confirm the food is safe', text)
            self.assertNotIn('Unable to assess', text)
            self.assertNotIn('No intolerances found', text)

    def test_both_renderers_guard_direct_zero_token_calls(self):
        pg = self.seeded()
        pg.evaluate("renderScanResults({ingredients:[],matches:[],rawText:'12345'})")
        self.assert_unable(pg)
        pg.evaluate("scanIngredients('12345 !!!')")
        self.assert_unable(pg)

    def test_partial_upload_analysis_is_not_reported_as_all_clear(self):
        pg = self.seeded()
        pg.evaluate("scanIngredients([...Array(50).fill('sugar'),'milk'].join(', '))")
        self.assert_unable(pg)
        self.assertIn('50-ingredient', pg.locator('#scanResults').inner_text())
        # A conflict within the processed portion still remains a conflict.
        pg.evaluate("scanIngredients(['milk',...Array(50).fill('sugar')].join(', '))")
        self.assertIn('Found 1 intolerance', pg.locator('#scanResults').inner_text())
        self.assertIn('Showing first 50', pg.locator('#scanResults').inner_text())

    def test_manual_results_reject_missing_data_and_unusable_text(self):
        pg = self.seeded()
        for text in ['', '12345 !!!', ',,,']:
            pg.evaluate('(text)=>{document.getElementById("testIngredientInput").value=text;testFoodIngredients()}', text)
            self.assert_unable(pg, '#testIngredientResults')
        pg.evaluate("intolerances[currentPet]=[];document.getElementById('testIngredientInput').value='sugar';testFoodIngredients()")
        self.assert_unable(pg, '#testIngredientResults')

    def test_diet_results_reject_missing_data_or_zero_ingredients(self):
        pg = self.seeded()
        for ingredients, profile in [([], ['milk']), (['12345'], ['milk']), (['sugar'], [])]:
            pg.evaluate("""([ingredients,profile])=>analyzeDietIngredients(ingredients,currentPet,profile,
              document.getElementById('dietPlanResultsModal'))""", [ingredients, profile])
            self.assert_unable(pg, '#dietPlanResultsModal')

    def test_manual_and_diet_valid_no_match_copy_is_qualified(self):
        pg = self.seeded()
        pg.evaluate("document.getElementById('testIngredientInput').value='sugar';testFoodIngredients()")
        pg.evaluate("analyzeDietIngredients(['sugar'],currentPet,['milk'],document.getElementById('dietPlanResultsModal'))")
        for selector in ['#testIngredientResults', '#dietPlanResultsModal']:
            text = pg.locator(selector).inner_text()
            self.assertIn('No listed conflicts detected', text)
            self.assertIn('does not confirm the food is safe', text)

    def test_empty_and_unreadable_diet_files_show_unable_to_assess(self):
        pg = self.seeded()
        for content in ['', '12345 !!!']:
            pg.evaluate("""text=>processDietTextFile(new File([text],'synthetic.txt'),currentPet,['milk'],
              document.getElementById('dietPlanResultsModal'))""", content)
            pg.wait_for_function("document.getElementById('dietPlanResultsModal').textContent.includes('Unable to assess')")
            self.assert_unable(pg, '#dietPlanResultsModal')
        pg.evaluate("""()=>{window.TemporaryReader=FileReader;
          window.FileReader=class{readAsText(){this.onerror()}};
          processDietTextFile(new File(['x'],'synthetic.txt'),currentPet,['milk'],document.getElementById('dietPlanResultsModal'));
          window.FileReader=window.TemporaryReader}""")
        self.assert_unable(pg, '#dietPlanResultsModal')

    def test_unable_message_does_not_execute_error_content(self):
        pg = self.seeded()
        pg.evaluate('p=>{window.testExecuted=false;showScanUnableToAssess(p)}', fixtures.PAYLOAD)
        pg.wait_for_timeout(100)
        self.assertFalse(pg.evaluate('window.testExecuted'))
        self.assertEqual(pg.locator('#scanResults img').count(), 0)
        self.assertIn(fixtures.PAYLOAD, pg.locator('#scanResults').inner_text())

    def test_attempts_do_not_write_profile_data_or_backups(self):
        pg = self.seeded()
        before = pg.evaluate('profileStorageSnapshot()')
        backup = pg.evaluate("localStorage.getItem('myDNADiet_stabilizationBackup_v1')")
        self.camera(pg, {'text': 'sugar, salt', 'confidence': 95})
        self.camera(pg, {'text': '', 'confidence': 95})
        self.upload(pg, {'text': 'milk, salt', 'confidence': 95})
        self.upload(pg, {'text': 'sugar, salt', 'confidence': 10})
        self.assertEqual(pg.evaluate('profileStorageSnapshot()'), before)
        self.assertEqual(pg.evaluate("localStorage.getItem('myDNADiet_stabilizationBackup_v1')"), backup)

    def test_missing_document_libraries_show_unable_in_the_diet_result(self):
        pg = self.seeded()
        for function, filename in [('processDietPdfFile','synthetic.pdf'), ('processDietDocxFile','synthetic.docx')]:
            with self.subTest(function=function):
                pg.evaluate("document.getElementById('dietPlanResultsModal').textContent='Processing…'")
                pg.evaluate("""([name,filename])=>window[name](new File(['synthetic'],filename),currentPet,['milk'],
                  document.getElementById('dietPlanResultsModal'))""", [function, filename])
                pg.wait_for_function("document.getElementById('dietPlanResultsModal').textContent.includes('Unable to assess')")
                self.assert_unable(pg, '#dietPlanResultsModal')
        self.assertEqual(pg.errors, [])


if __name__ == '__main__':
    unittest.main()
