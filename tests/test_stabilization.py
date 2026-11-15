"""Browser regression checks. Synthetic fixtures only; all network requests are intercepted.
Run: python -m unittest discover -s tests -v
Requires Playwright and Chromium (CHROMIUM_PATH may select a system executable).
"""
import json
import os
from pathlib import Path
import unittest
from playwright.sync_api import sync_playwright

ROOT = Path(os.environ.get('DNA_TEST_ROOT', Path(__file__).resolve().parents[1]))
A = 'Synthetic A'
B = 'Synthetic B'
ROWS_A = [{'item': 'milk', 'category': 'Other', 'level': 3, 'note': 'keep metadata'}]
ROWS_B = [{'item': 'soy', 'category': 'Other', 'level': 1}]
PROFILES = {A: {'intolerances': ROWS_A, 'createdAt': 123, 'custom': 'preserve'},
            B: {'intolerances': ROWS_B, 'createdAt': 456}}
PAYLOAD = '<img src=x onerror="window.testExecuted=true">'


class StabilizationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.p = sync_playwright().start()
        options = {'headless': True}
        if os.environ.get('CHROMIUM_PATH'):
            options['executable_path'] = os.environ['CHROMIUM_PATH']
        cls.browser = cls.p.chromium.launch(**options)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.p.stop()

    def setUp(self):
        self.contexts = []

    def tearDown(self):
        for ctx in self.contexts:
            ctx.close()

    def fresh(self, storage=None, offline_seeds=False, init=None):
        ctx = self.browser.new_context(accept_downloads=True, viewport={'width': 393, 'height': 851})
        self.contexts.append(ctx)
        if storage:
            ctx.add_init_script('''if (!sessionStorage.getItem('testSeeded')) {
              for (const [k,v] of Object.entries(%s)) localStorage.setItem(k,v);
              sessionStorage.setItem('testSeeded','1');
            }''' % json.dumps(storage))
        if init:
            ctx.add_init_script(init)
        def route(r):
            url = r.request.url
            if not url.startswith('https://dna.test/'):
                r.abort()
                return
            relative = url.removeprefix('https://dna.test/') or 'index.html'
            if relative.endswith('-data.json'):
                if offline_seeds:
                    r.abort()
                else:
                    name = relative.split('-')[0].capitalize()
                    r.fulfill(json={'name': name, 'type': 'example', 'intolerances': [
                        {'item': 'fixture ingredient', 'category': 'Other', 'level': 2}]})
                return
            f = ROOT / relative
            if f.is_file():
                r.fulfill(path=str(f))
            else:
                r.fulfill(status=404, body='')
        ctx.route('**/*', route)
        pg = ctx.new_page()
        pg.on('dialog', lambda d: d.accept())
        pg.errors = []
        pg.on('pageerror', lambda e: pg.errors.append(str(e)))
        pg.goto('https://dna.test/')
        pg.wait_for_timeout(1100)
        return pg

    def seeded(self):
        return self.fresh({'profileData': json.dumps(PROFILES),
                           'myDNADiet_lastActiveProfile': A,
                           'myDNADiet_onboardingComplete': 'true'})

    def test_fresh_start_and_onboarding_without_optional_libraries(self):
        pg = self.fresh()
        self.assertEqual(pg.errors, [])
        self.assertTrue(pg.locator('#onboardingModal').is_visible())
        self.assertEqual(pg.evaluate('Object.keys(intolerances).length'), 4)

    def test_start_with_unavailable_seed_files(self):
        pg = self.fresh(offline_seeds=True)
        self.assertEqual(pg.errors, [])
        self.assertTrue(pg.locator('#onboardingModal').is_visible())

    def test_selected_profile_does_not_merge_stale_globals(self):
        pg = self.seeded()
        actual = pg.evaluate("""()=>{selectPet('Synthetic B');userIntoleranceList=['milk'];
          currentProfileName='Synthetic A';return getActiveIntoleranceStringsForMatching()}""")
        self.assertEqual(actual, ['soy'])

    def test_switch_hydrates_editor_and_preserves_metadata(self):
        pg = self.seeded()
        pg.evaluate('(name)=>selectPet(name)', B)
        self.assertEqual(pg.evaluate('userIntolerances'), ROWS_B)
        pg.evaluate('(name)=>selectPet(name)', A)
        self.assertEqual(pg.evaluate('userIntolerances'), ROWS_A)
        pg.evaluate("document.getElementById('itemInput').value='peanut'; addIntoleranceItem()")
        pg.reload()
        pg.wait_for_timeout(200)
        self.assertEqual(pg.evaluate('getActiveIntoleranceStringsForMatching()'), ['milk', 'peanut'])
        self.assertEqual(pg.evaluate("profileData['Synthetic B'].intolerances"), ROWS_B)
        self.assertEqual(pg.evaluate("profileData['Synthetic A'].custom"), 'preserve')
        self.assertEqual(pg.evaluate('userIntolerances[0].note'), 'keep metadata')

    def test_delete_last_item_persists_and_stops_matching_after_reload(self):
        pg = self.seeded()
        pg.evaluate('removeIntoleranceItem(0)')
        self.assertEqual(pg.evaluate('getActiveIntoleranceStringsForMatching()'), [])
        self.assertEqual(pg.evaluate("JSON.parse(localStorage.getItem('myDNADiet_userIntolerances')).intolerances"), [])
        pg.reload()
        pg.wait_for_timeout(200)
        self.assertEqual(pg.evaluate('userIntolerances'), [])
        self.assertEqual(pg.evaluate('getActiveIntoleranceStringsForMatching()'), [])
        self.assertEqual(pg.evaluate("profileData['Synthetic B'].intolerances"), ROWS_B)

    def test_clear_list_and_explicit_save_support_empty_profiles(self):
        pg = self.seeded()
        pg.evaluate('clearAllIntolerances()')
        self.assertTrue(pg.evaluate('saveIntolerances()'))
        pg.reload()
        pg.wait_for_timeout(200)
        self.assertEqual(pg.evaluate('userIntolerances'), [])

    def test_empty_canonical_profile_wins_over_stale_legacy_snapshot(self):
        profiles = {A: {'intolerances': []}}
        pg = self.fresh({'profileData': json.dumps(profiles),
                        'myDNADiet_userIntolerances': json.dumps({'name': A, 'intolerances': ROWS_A}),
                        'myDNADiet_allProfiles': json.dumps({'profiles': {A: {'intolerances': ROWS_A, 'type': 'user'}}}),
                        'myDNADiet_lastActiveProfile': A})
        self.assertEqual(pg.evaluate('userIntolerances'), [])
        self.assertEqual(pg.evaluate('getActiveIntoleranceStringsForMatching()'), [])

    def test_onboarding_keeps_custom_profile(self):
        pg = self.seeded()
        pg.evaluate('closeOnboarding()')
        self.assertEqual(pg.evaluate('currentPet'), A)

    def test_full_backup_download_restore_and_reload(self):
        pg = self.seeded()
        with pg.expect_download() as download:
            backup = pg.evaluate('backupAllProfiles()')
        saved = json.loads(Path(download.value.path()).read_text())
        self.assertEqual(saved, backup)
        self.assertEqual(saved['profiles'][A]['intolerances'], ROWS_A)
        other = self.fresh()
        self.assertTrue(other.evaluate('(data)=>restoreFromBackup(data)', saved))
        self.assertEqual(other.evaluate('getActiveIntoleranceStringsForMatching()'), ['milk'])
        other.reload()
        other.wait_for_timeout(200)
        self.assertEqual(other.evaluate('userIntolerances'), ROWS_A)
        self.assertEqual(other.evaluate("profileData['Synthetic A'].custom"), 'preserve')
        self.assertNotIn('myDNADiet_auth', saved['storageSnapshot'])

    def test_legacy_backup_restores_empty_rows_without_deleting_other_profiles(self):
        pg = self.seeded()
        legacy = {'version': '1.0', 'profiles': {A: {'intolerances': []}}, 'currentProfile': A}
        self.assertTrue(pg.evaluate('(data)=>restoreFromBackup(data)', legacy))
        self.assertEqual(pg.evaluate('getActiveIntoleranceStringsForMatching()'), [])
        self.assertEqual(pg.evaluate("profileData['Synthetic B'].intolerances"), ROWS_B)

    def test_single_profile_export_import_round_trip(self):
        pg = self.seeded()
        with pg.expect_download() as download:
            exported = pg.evaluate('exportProfileData()')
        saved = json.loads(Path(download.value.path()).read_text())
        self.assertEqual(saved, exported)
        other = self.fresh()
        self.assertTrue(other.evaluate('(data)=>importProfileData(data)', saved))
        self.assertEqual(other.evaluate('getActiveIntoleranceStringsForMatching()'), ['milk'])
        self.assertEqual(other.evaluate('userIntolerances'), ROWS_A)

    def test_invalid_restore_preserves_storage(self):
        pg = self.seeded()
        before = pg.evaluate('profileStorageSnapshot()')
        self.assertFalse(pg.evaluate("restoreFromBackup({version:'1.0',profiles:{bad:{intolerances:[null]}}})"))
        self.assertEqual(pg.evaluate('profileStorageSnapshot()'), before)

    def test_recovery_snapshot_precedes_writes_and_is_not_replaced(self):
        original = json.dumps(PROFILES)
        pg = self.seeded()
        snapshot = pg.evaluate("JSON.parse(localStorage.getItem('myDNADiet_stabilizationBackup_v1'))")
        self.assertEqual(snapshot['storage']['profileData'], original)
        pg.evaluate('removeIntoleranceItem(0)')
        self.assertEqual(pg.evaluate("JSON.parse(localStorage.getItem('myDNADiet_stabilizationBackup_v1'))"), snapshot)

    def test_storage_failure_is_visible_and_rolls_back(self):
        pg = self.seeded()
        pg.evaluate('saveAllProfiles()')
        before = pg.evaluate('profileStorageSnapshot()')
        result = pg.evaluate("""async()=>{const native=Storage.prototype.setItem;let once=true;
          Storage.prototype.setItem=function(k,v){if(k==='myDNADiet_allProfiles'&&once){once=false;throw new DOMException('full','QuotaExceededError')}return native.call(this,k,v)};
          userIntolerances=[]; const saved=await autoSaveIntolerances();Storage.prototype.setItem=native;return saved}""")
        self.assertFalse(result)
        self.assertEqual(pg.evaluate('profileStorageSnapshot()'), before)
        self.assertIn('could not be saved', pg.locator('#uploadStatus').inner_text())
        self.assertTrue(pg.locator('#profileSaveError').is_visible())

    def test_corrupt_storage_is_preserved_and_not_overwritten(self):
        pg = self.fresh({'profileData': '{broken'})
        self.assertEqual(pg.errors, [])
        self.assertFalse(pg.evaluate('autoSaveIntolerances()'))
        self.assertEqual(pg.evaluate("localStorage.getItem('profileData')"), '{broken')

    def test_blocked_storage_does_not_abort_startup(self):
        pg = self.fresh(init="Storage.prototype.getItem=function(){throw new DOMException('blocked','SecurityError')}")
        self.assertEqual(pg.errors, [])
        self.assertTrue(pg.locator('#onboardingModal').is_visible())
        self.assertFalse(pg.evaluate('autoSaveIntolerances()'))

    def test_user_content_is_literal_in_all_result_renderers(self):
        pg = self.seeded()
        pg.evaluate("""p=>{window.testExecuted=false;userIntolerances=[{item:p,category:p,level:3}];loadCurrentIntolerances();
          onboardingIntolerances=userIntolerances;displayOnboardingIntolerances();
          renderScanResults({ingredients:[p],matches:[p],rawText:p});
          document.getElementById('testIngredientInput').value=p;intolerances[currentPet]=[p];testFoodIngredients();
          analyzeDietIngredients([p],currentPet,[p],document.getElementById('dietPlanResultsModal'));
          showError(p);showDebugInfo();}""", PAYLOAD)
        pg.wait_for_timeout(100)
        self.assertFalse(pg.evaluate('window.testExecuted'))
        for selector in ['#currentIntolerances', '#onboardingIntolerancesList', '#scanResults', '#testIngredientResults', '#dietPlanResultsModal', '#scanStatus']:
            # The renderer must not create injected nodes, even in hidden modals.
            self.assertEqual(pg.locator(selector+' img').count(), 0)
        self.assertIn(PAYLOAD, pg.locator('#currentIntolerances').inner_text())

    def test_extracted_ingredient_button_uses_closure_not_code_string(self):
        pg = self.seeded()
        payload = "');window.testExecuted=true;//|" + PAYLOAD
        pg.evaluate('p=>{window.testExecuted=false;displayExtractedIngredients([p])}', payload)
        self.assertIsNone(pg.locator('#addExtractedIngredientsButton').get_attribute('onclick'))
        pg.locator('#addExtractedIngredientsButton').dispatch_event('click')
        pg.wait_for_timeout(100)
        self.assertFalse(pg.evaluate('window.testExecuted'))
        self.assertEqual(pg.evaluate('userIntolerances.at(-1).item'), payload)

    def test_json_upload_round_trip_and_empty_profile(self):
        pg = self.seeded()
        pg.evaluate("""()=>processJSONFile(new File([JSON.stringify({name:'Synthetic Imported',intolerances:[],custom:'preserve'})],'fixture.json',{type:'application/json'}))""")
        pg.wait_for_function("currentProfileName==='Synthetic Imported'")
        pg.wait_for_timeout(100)
        pg.reload()
        pg.wait_for_timeout(200)
        self.assertEqual(pg.evaluate('currentPet'), 'Synthetic Imported')
        self.assertEqual(pg.evaluate('userIntolerances'), [])
        self.assertEqual(pg.evaluate("profileData['Synthetic Imported'].custom"), 'preserve')

    def test_file_read_cannot_write_to_a_different_selected_profile(self):
        pg = self.seeded()
        pg.evaluate("""()=>{window.savedReader=FileReader;window.pendingReader=null;
          window.FileReader=class{readAsText(){window.pendingReader=this}};
          processJSONFile(new File(['{}'],'fixture.json'));selectPet('Synthetic B');
          window.pendingReader.onload({target:{result:JSON.stringify({intolerances:[{item:'peanut',category:'Other',level:3}]})}});
          window.FileReader=window.savedReader}""")
        self.assertEqual(pg.evaluate("profileData['Synthetic B'].intolerances"), ROWS_B)
        self.assertEqual(pg.evaluate('getActiveIntoleranceStringsForMatching()'), ['soy'])

    def test_profile_switch_discards_inflight_camera_result(self):
        pg = self.seeded()
        pg.evaluate("""()=>{openScanModal();document.getElementById('canvas').width=1;
          window.finishOcr=null;window.ocrExtract=()=>new Promise(resolve=>window.finishOcr=resolve);
          window.scanPromise=onProcessScanClick();selectPet('Synthetic B');window.finishOcr('milk');}""")
        pg.evaluate('window.scanPromise')
        self.assertNotIn('Found 1 intolerance', pg.locator('#scanResults').inner_text())
        self.assertEqual(pg.evaluate('getActiveIntoleranceStringsForMatching()'), ['soy'])


    def test_legacy_personal_profile_wins_over_same_named_seed(self):
        pg = self.fresh({'myDNADiet_userIntolerances': json.dumps({'name': 'Don', 'intolerances': ROWS_A})})
        self.assertEqual(pg.evaluate('getActiveIntoleranceStringsForMatching()'), ['milk'])
        self.assertEqual(pg.evaluate('userIntolerances'), ROWS_A)

    def test_orphan_per_profile_keys_are_backed_up_and_restored(self):
        pg = self.fresh({'myDNADiet_profile_Synthetic A': json.dumps({'intolerances': ROWS_A}),
                         'myDNADiet_profile_Synthetic B': json.dumps({'intolerances': []}),
                         'myDNADiet_lastActiveProfile': B})
        with pg.expect_download():
            backup = pg.evaluate('backupAllProfiles()')
        self.assertEqual(backup['profiles'][A]['intolerances'], ROWS_A)
        other = self.fresh()
        self.assertTrue(other.evaluate('(x)=>restoreFromBackup(x)', backup))
        self.assertEqual(other.evaluate('getActiveIntoleranceStringsForMatching()'), [])
        other.evaluate('(x)=>selectPet(x)', A)
        self.assertEqual(other.evaluate('userIntolerances'), ROWS_A)

    def test_actual_remove_button_persists(self):
        pg = self.seeded()
        pg.evaluate('openUploadModal()')
        pg.locator('#currentIntolerances button').click()
        pg.reload()
        pg.wait_for_timeout(200)
        self.assertEqual(pg.evaluate('getActiveIntoleranceStringsForMatching()'), [])

    def test_text_import_stays_with_selected_profile(self):
        pg = self.seeded()
        pg.evaluate("processTextFile(new File(['peanut 3'],'fixture.txt'))")
        pg.wait_for_function("userIntolerances.some(row=>row.item.toLowerCase().includes('peanut'))")
        self.assertEqual(pg.evaluate("profileData['Synthetic B'].intolerances"), ROWS_B)
        pg.reload()
        pg.wait_for_timeout(200)
        self.assertEqual(pg.evaluate('currentPet'), A)
        self.assertTrue(pg.evaluate("getActiveIntoleranceStringsForMatching().some(x=>x.includes('peanut'))"))

    def test_csv_parser_callback_persists_only_selected_profile(self):
        pg = self.seeded()
        pg.evaluate("""()=>{window.Papa={parse:(text,options)=>options.complete({errors:[],data:[{Item:'peanut',Level:'3'}]})};
          processCSVFile(new File(['fixture'],'fixture.csv'))}""")
        pg.wait_for_function("userIntolerances.some(row=>row.item==='peanut')")
        self.assertEqual(pg.evaluate("profileData['Synthetic B'].intolerances"), ROWS_B)
        pg.reload()
        pg.wait_for_timeout(200)
        self.assertEqual(pg.evaluate('getActiveIntoleranceStringsForMatching()'), ['peanut'])
        self.assertEqual(pg.evaluate('userIntolerances[0].level'), 3)

    def test_imported_profile_name_and_fields_are_literal(self):
        pg = self.seeded()
        pg.evaluate("""p=>{window.testExecuted=false;processJSONFile(new File([JSON.stringify({name:p,
          intolerances:[{item:p,category:p,level:3}]})],'fixture.json'))}""", PAYLOAD)
        pg.wait_for_function('(p)=>currentProfileName===p', arg=PAYLOAD)
        pg.wait_for_timeout(100)
        pg.evaluate('completeOnboarding()')
        self.assertEqual(pg.locator('#activeProfileName').text_content(), PAYLOAD)
        self.assertEqual(pg.locator('#scanResults img').count(), 0)
        self.assertEqual(pg.locator('#currentIntolerances img').count(), 0)
        self.assertFalse(pg.evaluate('window.testExecuted'))

    def test_special_object_key_profile_names_do_not_change_prototypes(self):
        pg = self.seeded()
        data = {'profileName': '__proto__', 'data': {'intolerances': ROWS_B}}
        self.assertTrue(pg.evaluate('(x)=>importProfileData(x)', data))
        self.assertEqual(pg.evaluate('getActiveIntoleranceStringsForMatching()'), ['soy'])
        self.assertIsNone(pg.evaluate('Object.getPrototypeOf(profileData)'))
        self.assertEqual(pg.evaluate("profileData['Synthetic A'].intolerances"), ROWS_A)

    def test_local_first_mode_cannot_be_overwritten_by_legacy_cloud_restore(self):
        pg = self.seeded()
        pg.evaluate("""async()=>{isAuthenticated=true;currentUser={username:'synthetic'};
          await loadUserCloudData();
          await loadProfilesFromCloudData({profiles:{'Cloud Fixture':{intolerances:[{item:'peanut'}]}},
            intolerances:{'Cloud Fixture':['peanut']},userIntolerances:[{item:'peanut'}],currentProfileName:'Cloud Fixture'})}""")
        self.assertEqual(pg.evaluate('currentPet'), A)
        self.assertEqual(pg.evaluate('getActiveIntoleranceStringsForMatching()'), ['milk'])
        self.assertEqual(pg.evaluate('userIntolerances'), ROWS_A)
        self.assertFalse(pg.evaluate("Object.hasOwn(profileData,'Cloud Fixture')"))


if __name__ == '__main__':
    unittest.main()
