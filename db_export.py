import pandas as pd
import numpy as np
import sys


RT = 'reaction_time'


def increment_index(df):
    df.index = range(1, len(df.index) + 1)


def create_response_columns(df):
    df['time_target'] = ((df['reaction_type'] == 1) & (df['target_shown'] == 0)).astype(int)
    df['time_no_target'] = ((df['reaction_type'] == 1) & (df['target_shown'] == 2)).astype(int)
    df['late_target'] = ((df['reaction_type'] == 0) & (df['target_shown'] == 0)).astype(int)
    df['late_no_target'] = ((df['reaction_type'] == 0) & (df['target_shown'] == 2)).astype(int)
    df['early_target'] = ((df['reaction_type'] == -1) & (df['target_shown'] == 0)).astype(int)
    df['early_no_target'] = ((df['reaction_type'] == -1) & (df['target_shown'] == 2)).astype(int)


def create_percent_columns(df, new_df, groups):
    gb = df.groupby(groups)
    new_df['% time_target'] = gb['time_target'].mean().tolist()
    new_df['% late_no_target'] = gb['late_no_target'].mean().tolist()
    new_df['% time_no_target'] = gb['time_no_target'].mean().tolist()
    new_df['% late_target'] = gb['late_target'].mean().tolist()
    new_df['% early_target'] = gb['early_target'].mean().tolist()
    new_df['% early_no_target'] = gb['early_no_target'].mean().tolist()
    new_df['% mistake'] = gb['mistake'].mean().to_list()

    for col in [x for x in new_df.columns if x.startswith('% ')]:  # show as percent
        new_df[col] *= 100


def ratios(df, new_df, groups, title=''):
    by_trial_type = df.groupby(groups)[RT].mean().reset_index()  # data or positiveData?!
    new_df['{} Rhythmic/random'.format(title)] = (by_trial_type[by_trial_type['trial_type'] == 1][RT].tolist() / by_trial_type[by_trial_type['trial_type'] == 3][RT]).to_list()
    new_df['{} Interval/random'.format(title)] = (by_trial_type[by_trial_type['trial_type'] == 2][RT].tolist() / by_trial_type[by_trial_type['trial_type'] == 3][RT]).to_list()
    new_df['{} Log(random) - Log(Rhythmic)'.format(title)] = (np.log10(by_trial_type[by_trial_type['trial_type'] == 3][RT].tolist())  - np.log10(by_trial_type[by_trial_type['trial_type'] == 1][RT]).to_list())
    new_df['{} Log(random) - Log(Interval)'.format(title)] = (np.log10(by_trial_type[by_trial_type['trial_type'] == 3][RT].tolist())  - np.log10(by_trial_type[by_trial_type['trial_type'] == 2][RT]).to_list())



def preprocessing(df, analyze_part):
    # data = pd.read_excel(input_path)
    data = df
    data.columns = data.columns.map(lambda x: x.strip())
    data['user_code'] = data['user_code'].astype(str).apply(lambda x: x.strip())
    # legit_users = ['A_AYGE9048', 'A_ADGL4716', 'A_TAMA9557', 'A_TZGO7936', 'B_ITKI6815', 'B_NAMA0554', 'B_NEBA1519']
    # data = data[data['user_code'].isin(legit_users)]  # for now. only real trials.
    data = data.drop_duplicates(subset=['user_code', 'block_num', 'trial_num'])
    if analyze_part:
        data = data.drop([''], axis=1)
        data['part'] = data.apply(lambda row: 1 if row['block_num'] < 7 else 2, axis=1)  # data['block_num']<7
        data['legit'] = (data['reaction_type'] == 1).astype(int)
        data['block_100'] = (data['user_code'].apply(lambda x: x.startswith('A')) & (data['part']==2)) | (data['user_code'].apply(lambda x: x.startswith('B')) & (data['part']==1))
    create_response_columns(data)
    data['mistake'] = ((data['time_target'] == 0) & (data['late_no_target'] == 0)).astype(int)
    # dataCorrectPositive = data[(data[RT] > 0) & (data[RT] < 3000) & (data['target_shown']==0) ]
    data_correct_positive = data[(data['reaction_type'] == 1) & (data['target_shown'] == 0)]
    return data, data_correct_positive


def export_to_excel(df, output_path, analyze_part=True):
    data, data_correct_positive = preprocessing(df, analyze_part)

    #  ===============     BLOCK       ====================
    # mean RT by block
    by_block = data_correct_positive.groupby(['user_code', 'block_num'])
    block = by_block[RT].mean().reset_index()
    block['RT std'] = by_block[RT].std().to_list()
    block['RT long'] = data_correct_positive[data_correct_positive['long_2'] == 2].groupby(['user_code', 'block_num'])[RT].mean().to_list()
    block['RT long std'] = data_correct_positive[data_correct_positive['long_2'] == 2].groupby(['user_code', 'block_num'])[RT].std().to_list()
    block['RT short'] = data_correct_positive[data_correct_positive['long_2'] == 1].groupby(['user_code', 'block_num'])[RT].mean().to_list()
    block['RT short std'] = data_correct_positive[data_correct_positive['long_2'] == 1].groupby(['user_code', 'block_num'])[RT].std().to_list()
    block['% mistake'] = data.groupby(['user_code', 'block_num'])['mistake'].mean().to_list()
    create_percent_columns(data, block, ['user_code', 'block_num'])
    block['trial type'] = data.groupby(['user_code', 'block_num'])['trial_type'].unique().to_list()

    #  ===============     PART - TRIAL TYPE       ====================
    # CONDITION:
    # mean RT by condition and part
    if analyze_part:
        by_type = data_correct_positive.groupby(['user_code', 'part', 'trial_type'])
        part_type = by_type[RT].mean().reset_index()
        part_type['std'] = by_type[RT].std().to_list()
        part_type['RT long'] = data_correct_positive[data_correct_positive['long_2'] == 2].groupby(['user_code', 'part', 'trial_type'])[RT].mean().to_list()
        part_type['RT long std'] = data_correct_positive[data_correct_positive['long_2'] == 2].groupby(['user_code', 'part', 'trial_type'])[RT].std().to_list()
        part_type['RT short'] = data_correct_positive[data_correct_positive['long_2'] == 1].groupby(['user_code', 'part', 'trial_type'])[RT].mean().to_list()
        part_type['RT short std'] = data_correct_positive[data_correct_positive['long_2'] == 1].groupby(['user_code', 'part', 'trial_type'])[RT].std().to_list()
        part_type['% mistake'] = data.groupby(['user_code', 'part', 'trial_type'])['mistake'].mean().to_list()
        create_percent_columns(data, part_type, ['user_code', 'part', 'trial_type'])
        #  ================     BY 100 - 75
        by_type = data_correct_positive.groupby(['user_code', 'block_100', 'trial_type'])
        type100_75 = by_type[RT].mean().reset_index()
        type100_75['std'] = by_type[RT].std().to_list()
        type100_75['RT long'] = data_correct_positive[data_correct_positive['long_2'] == 2].groupby(['user_code', 'block_100', 'trial_type'])[RT].mean().to_list()
        type100_75['RT long std'] = data_correct_positive[data_correct_positive['long_2'] == 2].groupby(['user_code', 'block_100', 'trial_type'])[RT].std().to_list()
        type100_75['RT short'] = data_correct_positive[data_correct_positive['long_2'] == 1].groupby(['user_code', 'block_100', 'trial_type'])[RT].mean().to_list()
        type100_75['RT short std'] = data_correct_positive[data_correct_positive['long_2'] == 1].groupby(['user_code', 'block_100', 'trial_type'])[RT].std().to_list()
        type100_75['% mistake'] = data.groupby(['user_code', 'block_100', 'trial_type'])['mistake'].mean().to_list()
        create_percent_columns(data, type100_75, ['user_code', 'block_100', 'trial_type'])

    # ========================================= ==================================================
    #  ===============    CONDITION       ====================
    # CONDITION:
    # mean RT by condition
    condition = data_correct_positive.groupby(['user_code', 'trial_type'])[RT].mean().reset_index()
    condition['std'] = data_correct_positive.groupby(['user_code', 'trial_type'])[RT].std().to_list()
    condition['RT long'] = data_correct_positive[data_correct_positive['long_2'] == 2].groupby(['user_code', 'trial_type'])[RT].mean().to_list()
    condition['RT long std'] = data_correct_positive[data_correct_positive['long_2'] == 2].groupby(['user_code', 'trial_type'])[RT].std().to_list()
    condition['RT short'] = data_correct_positive[data_correct_positive['long_2'] == 1].groupby(['user_code', 'trial_type'])[RT].mean().to_list()
    condition['RT short std'] = data_correct_positive[data_correct_positive['long_2'] == 1].groupby(['user_code', 'trial_type'])[RT].std().to_list()
    condition['% mistake'] = data.groupby(['user_code', 'trial_type'])['mistake'].mean().to_list()
    create_percent_columns(data, condition, ['user_code', 'trial_type'])

    # ========================================= ==================================================

    # PART:
    if analyze_part:
        part = data_correct_positive.groupby(['user_code', 'part'])[RT].mean().reset_index()
        part['STD'] = data_correct_positive.groupby(['user_code', 'part'])[RT].std().to_list()
        # % Nan by PART
        part['% mistake'] = data.groupby(['user_code', 'part'])['mistake'].mean().to_list()
        create_percent_columns(data, part, ['user_code', 'part'])
        ratios(data_correct_positive, part, ['user_code', 'part', 'trial_type'])

        block_75_100 = data_correct_positive.groupby(['user_code', 'block_100'])[RT].mean().reset_index()
        block_75_100['STD'] = data_correct_positive.groupby(['user_code', 'block_100'])[RT].std().to_list()
        # % Nan by BLOCK75
        block_75_100['% mistake'] = data.groupby(['user_code', 'block_100'])['mistake'].mean().to_list()
        create_percent_columns(data, block_75_100, ['user_code', 'block_100'])
        ratios(data_correct_positive, part, ['user_code', 'block_100', 'trial_type'])

    # TOTAL by user::
    user = data_correct_positive.groupby(['user_code'])[RT].mean().reset_index()
    user['STD'] = data_correct_positive.groupby(['user_code'])[RT].std().to_list()
    user['% mistake'] = data.groupby(['user_code'])['mistake'].mean().to_list()
    user['% mistake'] *= 100
    create_percent_columns(data, user, ['user_code'])
    user['count'] = data.groupby(['user_code'])['row'].count().to_list()

    # RATIOS for user:
    ratios(data_correct_positive, user, ['user_code', 'trial_type'])
    if analyze_part:
        data100correct = data_correct_positive[data_correct_positive['block_100']]
        data75correct = data_correct_positive[data_correct_positive['block_100'] == False]
        ratios(data100correct, user, ['user_code', 'trial_type'], '100')
        ratios(data75correct, user, ['user_code', 'trial_type'], '75')


    # by REACTION TYPE:
    reaction = data.groupby(['user_code', 'reaction_type'])[RT].mean().reset_index()
    reaction['std'] = data.groupby(['user_code', 'reaction_type'])[RT].std().to_list()
    reaction['count'] = data.groupby(['user_code', 'reaction_type'])[RT].count().to_list()
    # TOTAL:
    print('General mean:', data_correct_positive[RT].mean())

    increment_index(block)
    increment_index(condition)
    if analyze_part:
        increment_index(part_type)
        increment_index(type100_75)
        increment_index(part)
        increment_index(block_75_100)
    increment_index(reaction)
    increment_index(user)

    with pd.ExcelWriter(output_path) as writer:
        block.to_excel(writer, sheet_name='by block')
        condition.to_excel(writer, sheet_name='by condition')
        if analyze_part:
            part_type.to_excel(writer, sheet_name='condition by part')
            type100_75.to_excel(writer, sheet_name='condition by 75-100')
            part.to_excel(writer, sheet_name='by part')
            block_75_100.to_excel(writer, sheet_name='by block 75 100')
        reaction.to_excel(writer, sheet_name='by reaction')
        user.to_excel(writer, sheet_name='by user')


if __name__ == '__main__':
    # input_path = 'db1.csv'
    input_path = None

    if not input_path and (len(sys.argv) != 2 and len(sys.argv) != 3):
        print('Usage: <input_csv_file>')
        print("if old files, Usage: <input_csv_file> old ")
        exit(31)

    if not input_path:
        input_path = sys.argv[1]
    old = len(sys.argv) == 3 and sys.argv[2]=='old'
    if not old:
        data = pd.read_csv(input_path)
        export_to_excel(pd.read_csv(input_path), input_path+'.xlsx')
        exit(42)
    #  ======  for old data:
    xls = pd.ExcelFile(input_path)
    for sheet in xls.sheet_names:
        data = pd.read_excel(input_path, sheet_name=sheet)
        data = data.dropna()
        data[' reaction_time'] =  data[' reaction_time'] * 1000
        output = '{}_{}.xlsx'.format(input_path, sheet)
        export_to_excel(data, output, False)
    #
